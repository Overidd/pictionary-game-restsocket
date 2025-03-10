import { CustomError } from "@/application/error";
import { WebSocket } from "ws";


export class UserEntity {
   hasGuessedCorrectly: boolean
   isDisconnected: boolean
   constructor(
      public id: string,
      public ip: string,
      public username: string,
      public avatar: string,
      public score: number = 0,
      public connectionWs?: WebSocket,
      public roomId?: string, // Si el usuario estuvo en una sala 
      public isReady = false
   ) {
      this.hasGuessedCorrectly = false
      this.isDisconnected = false
   }

   public static fromObject = (object: { [key: string]: any }): UserEntity => {
      const { id, username, ip, avatar, score = 0, ws } = object;

      if (!id || !username || !ip || !avatar) {
         throw CustomError.badRequest('Invalid user object');
      }

      return new UserEntity(id, ip, username, avatar, score, ws);
   }

   public setConnectionWs(ws: WebSocket) {
      this.connectionWs = ws;
   }

   setRoomId(roomId: string) {
      this.roomId = roomId;
   }

   toggleReady() {
      this.isReady = !this.isReady
   }

   toJSON() {
      return {
         id: this.id,
         username: this.username,
         // ip: this.ip,
         avatar: this.avatar,
         score: this.score,
         isReady: this.isReady,
      };
   }
}