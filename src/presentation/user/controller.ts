import { UserRegisterDTO } from '@/application/dto';
import { CustomError } from '@/application/error';
import { UserService } from '@/application/service';
import { Request, Response } from 'express';


export class UserController {

   constructor(
      private readonly userService: UserService
   ) { }

   private handleError = (error: unknown, res: Response) => {
      if (error instanceof CustomError) {
         return res.status(error.statusCode).json({ error: error.message });
      }

      console.log(`${error}`);
      return res.status(500).json({ error: 'Internal server error' });
   };


   register = (req: Request, res: Response) => {
      const [errors, user] = UserRegisterDTO.create({ ...req.body, ip: req.socket.remoteAddress || '' });

      if (errors) {
         res.status(400).json({ errors });
         return
      }
      this.userService.register(user!)
         .then((data) => res.status(201).json(data))
         .catch((error) => this.handleError(error, res));
   }

   getAll = (req: Request, res: Response) => {
      this.userService.getAll()
         .then((users) => res.status(200).json(users))
         .catch((error) => this.handleError(error, res));
   }
}
