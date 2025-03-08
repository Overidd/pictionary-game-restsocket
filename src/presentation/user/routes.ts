import { Router } from 'express';
import { UserController } from './controller';
import { UserService } from '@/application/service/user.service';


//* path [/api/user]
export class UserRoutes {

   static get routes(): Router {
      const router = Router();
      const userService = UserService.instance
      const controller = new UserController(userService);


      // Crear un nuevo usuario
      router.post('/create', controller.register);
      router.get('/getAll', controller.getAll);

      return router;
   }
}
