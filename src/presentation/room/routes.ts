
import { Router } from 'express';
import { RoomController } from './controller';
import { WssService } from '@/application/service';


//* path [/api/room]
export class RoomrRoutes {

   static get routes(): Router {
      const router = Router();
      const wssService = WssService.instance
      const controller = new RoomController(wssService);


      // Crear un una nueva sala
      router.post('/create', controller.create);

      return router;
   }
}
