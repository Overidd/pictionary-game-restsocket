import { Request, Response } from "express";
import { CustomError } from "@/application/error";
import { WssService } from "@/application/service";
import { RoomDTO } from "@/application/dto";


export class RoomController {
   constructor(
      private readonly wssService: WssService
   ) { }

   private handleError = (error: unknown, res: Response) => {
      if (error instanceof CustomError) {
         return res.status(error.statusCode).json({ error: error.message });
      }

      console.log(`${error}`);
      return res.status(500).json({ error: 'Internal server error' });
   };

   create = (req: Request, res: Response): void => {
      const [errors, roomDto] = RoomDTO.create(req.body);

      if (errors) {
         console.log('raro');
         res.status(400).json({ errors });
         return
      }

      this.wssService.createRoom(roomDto!)
         .then((data) => res.status(201).json(data))
         .catch((error) => this.handleError(error, res));
   }
}