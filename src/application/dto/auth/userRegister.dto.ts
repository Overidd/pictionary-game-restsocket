import { UuidAdapter } from '@/adapter';
import { FieldValidation, TMessageErrors } from '../field.validation';

export class UserRegisterDTO {
   private constructor(
      public id: string,
      public username: string,
      public avatar: string,
      public ip: string,
   ) { }

   static create(body: { [key: string]: any }): [TMessageErrors[]?, UserRegisterDTO?] {
      const { username, avatar, ip } = body;

      const id = UuidAdapter.v4();

      const errors = new FieldValidation()
         .validate({ username, avatar })
         .getErrors();

      return [errors, new UserRegisterDTO(id, username, avatar, ip)];
   }

}