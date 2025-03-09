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
   public removePlayer(userId: string): void {
      this.players = this.players.filter(player => player.id !== userId);
   }

   // Enviador de mensajes
   public broadcast(type: string, payload: object) {
      this.players.forEach(player => {
         if (player.connectionWs?.readyState === WebSocket.OPEN) {
            player.connectionWs.send(JSON.stringify({ type, payload }));
         }
      });
   }

   public startGame(user: UserEntity) {
      const playersReady = this.players.filter(player => player.isReady).length
      if (playersReady < 1) {
         this.isStartedGame = false
         this.sendErrorStartGameUser(user)
         return
      }
      this.startGameRoom()
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

      this.sendWordSelected();
      this.sendStatusRoomGame();
   }

   public selectDrawingWords() {
      this.words = [];
      while (this.words.length < 3) {
         const word = wordPictionary[Math.floor(Math.random() * wordPictionary.length)];
         if (!this.words.includes(word)) {
            this.words.push(word);
         }
      }
   }

   public selectCartoonist() {
      this.currentCartoonist = this.players[Math.floor(Math.random() * this.players.length)];
   }

   public async selectWord(user: UserEntity, word: string) {
      this.currentWord = word;
      this.isStartedGame = true
      // Comienza la ronda
      this.currentRound += 1
      // Comienza el tiempo de dibujar
      this.sendStatusRoomGameUser(user);
      await IntervalUtil.interval(this.sendCurrentRoundTime.bind(this), 1000, 120);
   }

   public async canvasDrawn(user: UserEntity, base64Image: any) {
      this.sendCanvasImage(user, base64Image);
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
   public sendWordSelected() {
      this.currentCartoonist?.connectionWs?.send(JSON.stringify({ type: EtypeWss.WORD_SELECTED_ROOM, payload: { words: this.words } }));
   }

   public sendStatusRoomGameUser(user: UserEntity) {
      const statusRoomGame = this.getStatusRoomGame();
      if (user.id === this.currentCartoonist?.id) {
         user.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: statusRoomGame }));
         return
      }
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: { currentCartoonist: statusRoomGame.currentCartoonist, currentWord: null } }));
   }

   //* Metodos de envio a todos los usuarios

   public sendStatusRoomGame() {
      // this.broadcast(EtypeWss.ROOM_STATE_GAME, this.getStatusRoomGame());
      const statusRoomGame = this.getStatusRoomGame();
      for (const player of this.players) {
         if (player.connectionWs?.readyState !== WebSocket.OPEN) continue;

         if (player.id === this.currentCartoonist?.id) {
            player.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: statusRoomGame }));
            continue;
         }
         player.connectionWs?.send(JSON.stringify({ type: EtypeWss.ROOM_STATE_GAME, payload: { currentCartoonist: statusRoomGame.currentCartoonist, currentWord: null } }));
      }
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
}
