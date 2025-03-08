import { EtypeWss } from '../interface';
import { UserEntity } from './user.entity';
import { WebSocket } from 'ws';

export class RoomEntity {
   private players: UserEntity[];
   // private connections: Set<WebSocket>; // Guardar conexiones activas

   constructor(
      public readonly id: string,
      public readonly name: string,
      public readonly creatorId: string,
      public readonly player_quantity: number,
      public readonly round_quantity: number,
   ) {
      this.players = [];
      // this.connections = new Set();
   }

   public getPlayers(): UserEntity[] {
      return this.players;
   }

   public validateIsSpaceFull(): boolean {
      return this.players.length < this.player_quantity;
   }


   // Agregar un jugador a la sala
   public addPlayer(user: UserEntity): boolean {
      if (this.players.length < this.player_quantity) {
         user.setRoomId(this.id);
         this.players.push(user);
         this.sendDataWhenUserJoin(user);
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

   // Cuando un jugador se une a la sala
   // sendPlayerOnline
   public sendDataWhenUserJoin(user: UserEntity) {
      user.connectionWs?.send(JSON.stringify({ type: EtypeWss.JOINROOM, payload: this.getRoomState() }));
      // 'joinRoom', user.toJSON()

      // players online in a room
      // user.connectionWs?.send(JSON.stringify({ type: EtypeWss.PLAYERSONLINEROOM, payload: this.playersOnlineRoom() }));

   }

   public playersOnlineRoom() {
      return this.players.map(player => player.toJSON());
   }

   // Obtener estado de la sala
   public getRoomState() {
      return {
         id: this.id,
         name: this.name,
         creatorId: this.creatorId,
         players: this.players.map(player => player.toJSON()),
         player_quantity: this.player_quantity,
         round_quantity: this.round_quantity,
      };
   }
}
