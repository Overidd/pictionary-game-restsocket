
export type TMessageErrors = {
   field: string,
   message: string,
}

export class FieldValidation {
   private messageErrors: TMessageErrors[] = [];
   constructor() {
      this.messageErrors = []
   }

   private field(fieldArr: Record<string, any>) {
      Object.entries(fieldArr).forEach(([key, value]) => {
         if (!value) {
            this.messageErrors.push({
               field: key,
               message: `El campo ${key} es requerido`
            });
         }
      });
      return this;
   }

   validate(fields: Record<string, any>) {
      return this.field(fields)
   }

   getErrors(): TMessageErrors[] | undefined {
      return !this.messageErrors.length ? undefined : this.messageErrors;
   }
}