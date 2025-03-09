import { UuidAdapter } from '@/adapter';
import { FieldValidation, TMessageErrors } from '../field.validation';

export class RoomDTO {
   constructor(
      public id: string,
      public name: string,
      public creatorId: string,
      public maxPlayerQuantity: number,
      public roundQuantity: number
   ) { }


   static create(body: { [key: string]: any }): [TMessageErrors[]?, RoomDTO?] {

      const { name, creatorId, maxPlayerQuantity, roundQuantity } = body;

      const errors = new FieldValidation()
         .validate({ name, creatorId, maxPlayerQuantity, roundQuantity })
         .getErrors();

      const id = UuidAdapter.v4();

      return [errors, new RoomDTO(id, name, creatorId, parseInt(maxPlayerQuantity), parseInt(roundQuantity))];
   }
}