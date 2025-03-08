import { Router } from 'express';
import { UserRoutes } from './user';
import { RoomrRoutes } from './room/routes';

export class AppRoutes {


   static get routes(): Router {

      const router = Router();

      router.use('/api/user', UserRoutes.routes);
      router.use('/api/room', RoomrRoutes.routes);

      return router;
   }
}
