import { IntervalUtil, wordPictionary } from '@/utils';
import { EtypeWss } from '../interface';
import { UserEntity } from './user.entity';
import { WebSocket } from 'ws';

export class RoomEntity {
   private players: UserEntity[];
   private words: string[];
   private listCartoonists: string[];
   private currentCartoonist: UserEntity | null;
   private currentWord: string | null;
   private currentRound: number
   private isActiveDrawingTimer: boolean
   private isEndGame: boolean
   private currentPlayerWin: UserEntity | null
   // private connections: Set<WebSocket>; // Guardar conexiones activas

   constructor(
      public readonly id: string,
      public readonly name: string,
      public readonly creatorId: string,
      public readonly maxPlayerQuantity: number,
      public readonly roundQuantity: number,
      public playerQuantity?: number,
      public isStartedGame = false
   ) {
      this.players = [];
      this.words = [];
      this.listCartoonists = [];
      this.currentCartoonist = null; // Dibujante actual
      this.currentWord = null;
      this.currentRound = 0
      this.isActiveDrawingTimer = false
      this.isEndGame = false
      this.currentPlayerWin = null
      // this.connections = new Set();
   }

   public getPlayers(): UserEntity[] {
      return this.players;
   }

   public validateIsSpaceFull(): boolean {
      return this.players.length < this.maxPlayerQuantity;
   }

   public calculateCountPlayersOnline() {
      this.playerQuantity = this.players.length;
   }

   // Agregar un jugador a la sala
   public addPlayer(user: UserEntity): boolean {
      if (this.players.length < this.maxPlayerQuantity) {
         user.setRoomId(this.id);
         this.players.push(user);
         this.calculateCountPlayersOnline();
         return true;
      }
      return false;
   }

   // Remover un jugador de la sala
   public removePlayerById(userId: string): void {
      // const prevCount = this.players.length;
      this.players = this.players.filter(player => player.id !== userId);

      this.sendPlayersOnline();
      this.calculateCountPlayersOnline();
      this.sendPlayerQuantity();
   }


   // Enviador de mensajes
   public broadcast(type: string, payload: object) {
      const message = JSON.stringify({ type, payload });
      this.players.forEach(player => {
         if (player.connectionWs?.readyState === WebSocket.OPEN) {
            player.connectionWs.send(message);
         }
      });
   }


   public startGame(user: UserEntity) {
      if (!this.players.some(player => player.isReady)) {
         this.isStartedGame = false;
         this.sendErrorStartGameUser(user);
         return;
      }
      this.startGameRoom();
   }


   public readyGame() {
      this.sendPlayersOnline()
   }

   //* Cuando un jugador se une a la sala
   // Send request data after user joins
   public sendDataAfterUserJoin(user: UserEntity) {
      this.sendStatusRoomUser(user);
      this.sendIsPlayerCreatorUser(user);
      this.sendStatusRoomGameUser(user);
      this.sendPlayersOnline();
      this.sendPlayerQuantity();
      // this.sendPlayerOnlineUser(user); // Envias solo al jugador recien unido
      // this.sendStatusRoomUser(user); // Envias a todos los jugadores de la sala
   }

   public playersOnlineRoom() {
      return this.players.map(player => player.toJSON());
   }

   //* Metodo de inicio del juego
   public async startGameRoom() {
      this.broadcast(EtypeWss.START_GAME_ROOM_OK, { payload: 'ok' });

      this.selectDrawingWords(); // Seleccionar 3 palabras
      this.selectCartoonist();   // Seleccionar al dibujante

      await IntervalUtil.interval(this.sendIntervalStartGame.bind(this));

      this.sendWordSelectedUser();
      // this.sendStatusRoomGame();
   }

   public selectDrawingWords() {
      const wordsSet = new Set<string>();
      while (wordsSet.size < 3) {
         wordsSet.add(wordPictionary[Math.floor(Math.random() * wordPictionary.length)]);
      }
      this.words = Array.from(wordsSet);
   }


   public selectCartoonist() {
      this.currentCartoonist = this.players[Math.floor(Math.random() * this.players.length)];
   }

   public async selectWord(user: UserEntity, word: string) {

      if (this.isActiveDrawingTimer) return

      this.currentWord = word;
      this.isStartedGame = true
      // Comienza la ronda
      this.currentRound += 1
      // Comienza el tiempo de dibujar
      this.sendStatusRoomGame();

      let remainingTime = 120;

      this.isActiveDrawingTimer = true
      const interval = setInterval(() => {
         remainingTime--;
         this.sendCurrentRoundTime(remainingTime);

         if (remainingTime <= 0 || this.checkAllPlayersGuessed()) {
            clearInterval(interval);
            this.isActiveDrawingTimer = false
            this.nextRound();
         }
      }, 1000);

      // await IntervalUtil.interval(this.sendCurrentRoundTime.bind(this), 1000, 120);
      // Termina la ronda
      // if (this.round()) return
      // this.sendWordSelectedUser();
      // this.sendStatusRoomGame();
      // // Comenzar la siguiente ronda
   }

   private checkAllPlayersGuessed(): boolean {
      return this.players.every(player =>
         player.id === this.currentCartoonist?.id || player.hasGuessedCorrectly
      );
   }

   private nextRound() {
      // Reiniciar la propiedad hasGuessedCorrectly de todos los jugadores
      console.log(this.currentRound >= this.roundQuantity, 'nextRound', this.currentRound, this.roundQuantity);
      if (this.currentRound >= this.roundQuantity) {
         this.endGame();
         return;
      }
      this.players.forEach(player => {
         player.hasGuessedCorrectly = false
      })
      this.selectDrawingWords();
      this.selectCartoonist();
      // this.sendStatusRoomGame();
      this.sendNextRound();
      this.sendWordSelectedUser();
   }
   private endGame() {
      this.isEndGame = true
      let winner = this.players.reduce((max, player) => (player.score > max.score ? player : max), this.players[0]);
      if (!winner) {
         winner = this.players[0]
      }
      this.currentPlayerWin = winner
      this.broadcast(EtypeWss.END_GAME_ROOM, { score: winner?.score, username: winner?.username });
   }

   public async canvasDrawn(user: UserEntity, base64Image: any) {
      this.sendCanvasImage(user, base64Image);
   }


   public async chatMessage(user: UserEntity, message: string) {
      const newMessage = {
         isCorrect: false,
         username: user.username,
         message
      };

      if (this.normalizeWord(message) === this.normalizeWord(this.currentWord || '')) {
         newMessage.isCorrect = true;
         newMessage.message = 'Acerto';
         user.score += 100;
         user.hasGuessedCorrectly = true;
         this.sendPlayersOnline();
      }

      this.sendChatMessage(newMessage);
   }
   private normalizeWord(word: string): string {
      return word.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
   }


   // Obtener estado de la sala
   public getRoomState() {
      return {
         id: this.id,
         name: this.name,
         creatorId: this.creatorId,
         playerQuantity: this.playerQuantity,
         maxPlayerQuantity: this.maxPlayerQuantity,
         roundQuantity: this.roundQuantity,
         isStartedGame: this.isStartedGame,
      };
   }

   public getStatusRoomGame() {
      return {
         currentCartoonist: this.currentCartoonist?.username ?? null,
         currentWord: this.currentWord,
         currentRound: this.currentRound,
         playerWin: {
            isEndGame: this.isEndGame,
            username: this.currentPlayerWin?.username ?? null,
            score: this.currentPlayerWin?.score,
            avatar: this.currentPlayerWin?.avatar,
         }
      };
   }

   //* Metodos de envio solo al usuario que se unio a la sala
   public sendPlayerOnlineUser(user: UserEntity) {
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.PLAYERS_ONLINE_ROOM, payload: this.playersOnlineRoom() }));
   }
   public sendStatusRoomUser(user: UserEntity) {
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE, payload: this.getRoomState() }));
   }

   // Este metodo envia si el jugador es el creador de la sala
   public sendIsPlayerCreatorUser(user: UserEntity) {
      const isCreator = user.id === this.creatorId;
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.IS_PLAYER_CREATOR_ROOM, payload: { isCreator } }));
   }
   public sendErrorStartGameUser(user: UserEntity) {
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.ERROR_START_GAME_ROOM, payload: { message: 'No hay suficientes jugadores para iniciar el juego' } }));
   }
   public sendWordSelectedUser() {
      this.currentCartoonist?.connectionWs?.send(JSON.stringify({ type: EtypeWss.WORD_SELECTED_ROOM, payload: { words: this.words } }));
   }

   public sendStatusRoomGameUser(user: UserEntity) {
      const { currentWord, ...data } = this.getStatusRoomGame();
      if (user.id === this.currentCartoonist?.id) {
         user.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: { ...data, currentWord } }));
         return
      }
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: { ...data } }));
   }

   //* Metodos de envio a todos los usuarios

   public sendStatusRoomGame() {
      const { currentWord, ...data } = this.getStatusRoomGame();

      const messageForCartoonist = JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: { currentWord, ...data } });

      const messageForOthers = JSON.stringify({
         type: EtypeWss.ROOM_STATE_GAME,
         payload: { ...data }
      });

      this.players.forEach(player => {
         if (player.connectionWs?.readyState !== WebSocket.OPEN) return;
         player.connectionWs.send(player.id === this.currentCartoonist?.id ? messageForCartoonist : messageForOthers);
      });
   }

   // Envia todos los jugadores de la sala
   public sendPlayersOnline() {
      this.broadcast(EtypeWss.PLAYERS_ONLINE_ROOM, this.playersOnlineRoom());
   }

   public sendPlayerQuantity() {
      this.broadcast(EtypeWss.PLAYERS_QUANTITY_ONLINE_ROOM, {
         playerQuantity: this.playerQuantity || 0,
         maxPlayerQuantity: this.maxPlayerQuantity
      });
   }

   public sendIntervalStartGame(time: number) {
      this.broadcast(EtypeWss.INTERVAL_START_GAME_ROOM, { time });
   }

   public sendCurrentRoundTime(time: number) {
      this.broadcast(EtypeWss.CURRENT_ROUND_TIME_ROOM, { time });
   }

   // Enviar a todos menos al dibujante
   public sendCanvasImage(user: UserEntity, base64Image: any) {
      this.players.forEach(player => {
         if (player.id !== user.id && player.connectionWs?.readyState === WebSocket.OPEN) {
            player.connectionWs?.send(JSON.stringify({ type: EtypeWss.CANVAS_IMAGE_ROOM, payload: { base64Image } }));
         }
      });
   }

   public sendNextRound() {
      this.broadcast(EtypeWss.NEXT_ROUND_ROOM, { payload: 'ok' });
   }
   public sendChatMessage(newMessage: object) {
      this.broadcast(EtypeWss.CHAT_MESSAGE_ROOM, { ...newMessage });
   }
}
