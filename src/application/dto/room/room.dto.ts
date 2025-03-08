import { UuidAdapter } from '@/adapter';
import { FieldValidation, TMessageErrors } from '../field.validation';

export class RoomDTO {
   constructor(
      public id: string,
      public name: string,
      public creatorId: string,
      public player_quantity: number,
      public round_quantity: number
   ) { }


   static create(body: { [key: string]: any }): [TMessageErrors[]?, RoomDTO?] {

      const { name, creatorId, player_quantity, round_quantity } = body;

      const errors = new FieldValidation()
         .validate({ name, creatorId, player_quantity, round_quantity })
         .getErrors();

      const id = UuidAdapter.v4();

      return [errors, new RoomDTO(id, name, creatorId, parseInt(player_quantity), parseInt(round_quantity))];
   }
}