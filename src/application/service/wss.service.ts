import { RoomEntity } from '@/domain/entity';
import { Server } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { UserService } from './user.service';
import { UuidAdapter } from '@/adapter';
import { EtypeWss } from '@/domain/interface';
import { RoomDTO } from '../dto';

interface Options {
   server: Server;
   path?: string;
}

export class WssService {
   private static _instance: WssService;
   private wss: WebSocketServer;
   private rooms: Map<string, RoomEntity> = new Map(); // Guardar salas activas

   private constructor(options: Options) {
      const { server, path = '/ws' } = options;
      this.wss = new WebSocketServer({ server, path });
      this.start();
   }

   static get instance(): WssService {
      if (!WssService._instance) {
         throw 'WssService is not initialized';
      }
      return WssService._instance;
   }

   static initWss(options: Options) {
      WssService._instance = new WssService(options);
   }

   public getRooms() {
      return Array.from(this.rooms.values()).map(room => room.getRoomState());
   }

   public sendMessage(type: string, payload: object) {
      this.wss.clients.forEach((client) => {

         if (client.readyState === WebSocket.OPEN) {

            client.send(JSON.stringify({ type, payload }));
         }
      });
   }

   private start() {
      this.wss.on('connection', (ws: WebSocket, req) => {
         const url = new URL(req.url ?? '', `http://${req.headers.host}`);
         const userId = url.searchParams.get('userId');
         const roomId = url.pathname.replace('/ws/', '');

         if (!userId) {
            ws.close();
            return;
         }

         console.log('Cliente conectado al canal principal');

         UserService.instance.getById(userId).then((user) => {
            if (user) {
               console.log(`Usuario ${user.username} reconectado.`);
               user.setConnectionWs(ws); // Restaurar WebSocket

               // Si el usuario estaba en una sala, notificar su regreso
               if (!user.roomId) return;

               const room = this.rooms.get(user.roomId);
               if (room) {
                  room.sendDataAfterUserJoin(user);
               }
            } else {
               ws.close();
            }
         });

         this.sendMessage(EtypeWss.ROOMS, this.getRooms());

         ws.on('message', (message) => {
            const data = JSON.parse(message.toString());
            if (data.type === EtypeWss.JOINROOM) {
               this.joinRoom(data.payload);
            }

            if (data.type === EtypeWss.REQUEST_ROOM_DATA) {
               this.requestRoomData(data.payload);
            }

            if (data.type === EtypeWss.START_GAME) {
               this.startGame(data.payload);
            }

            if (data.type === EtypeWss.READY_GAME) {
               this.readyGame(data.payload);
            }
            if (data.type === EtypeWss.SELECT_WORD) {
               this.selectWord(data.payload);
            }
            if (data.type === EtypeWss.CANVAS_IMAGE_ROOM) {
               this.canvasImage(data.payload);
            }

         });
         ws.on('close', () => {
            console.log('Cliente desconectado');
            this.leaveRoom(roomId, ws);
         });
      });
   }

   public async canvasImage({ userId, base64Image }: any) {
      const user = await UserService.instance.getById(userId);
      if (!user || !user.roomId) return;
      const room = this.rooms.get(user.roomId);
      if (!room) return;
      room.canvasDrawn(user, base64Image);
   }

   // Metodo cuando el jugador selecciona una palabra
   public async selectWord({ userId, word }: any) {
      const user = await UserService.instance.getById(userId);
      if (!user || !user.roomId) return;
      const room = this.rooms.get(user.roomId);
      if (!room) return;

      room.selectWord(user, word);
   }

   public async startGame({ userId }: any) {
      const user = await UserService.instance.getById(userId);
      if (!user || !user.roomId) return;

      const room = this.rooms.get(user.roomId);
      if (!room) return;

      room.startGame(user);

      // const room = this.rooms.get(user.roomId);

      // const room = this.rooms.get(roomId);
      // if (!room) return;

   }

   public async readyGame({ userId }: any) {
      const user = await UserService.instance.getById(userId);
      if (!user || !user.roomId) return;
      const room = this.rooms.get(user.roomId);
      if (!room) return;
      user.toggleReady();
      room?.readyGame();
   }

   public async requestRoomData({ userId }: any) {
      const user = await UserService.instance.getById(userId);
      if (!user || !user.roomId) return;

      const room = this.rooms.get(user.roomId);
      if (!room) return;

      room.sendDataAfterUserJoin(user);
   }

   public async createRoom(roomDTO: RoomDTO) {
      // Verificar si ya existe una sala con el mismo nombre
      const roomExists = Array.from(this.rooms.values()).some(
         (room) => room.name === roomDTO.name
      );

      if (roomExists) {
         console.log(`La sala '${roomDTO.name}' ya existe.`);
         return; // Puedes lanzar un error si lo prefieres
      }

      // Generar ID de sala en el servidor
      const id = UuidAdapter.v4();

      const newRoom = new RoomEntity(
         id,
         roomDTO.name,
         roomDTO.creatorId,
         roomDTO.maxPlayerQuantity,
         roomDTO.roundQuantity,
      );

      this.rooms.set(id, newRoom);

      console.log(`Sala ${roomDTO.name} creada con ID: ${id}`);
      this.sendMessage(EtypeWss.ROOMS, this.getRooms());
      // this.sendMessage(EtypeWss.NEWROOM, newRoom.getRoomState());
      return id;
   }

   private async joinRoom({ roomId, userId }: { roomId: string; userId: string }) {
      const room = this.rooms.get(roomId);
      if (!room) return

      if (!room.validateIsSpaceFull()) return {
         type: 'error',
         message: 'La sala está llena'
      };

      console.log(`Cliente unido a la sala ${roomId}`);

      // room.addConnection(ws);
      const user = await UserService.instance.getById(userId);
      if (!user) {
         return {
            type: 'error',
            message: 'Usuario no encontrado'
         }
      }

      room.addPlayer(user);

      user.connectionWs!.send(JSON.stringify({ type: EtypeWss.JOINROOM, payload: 'ok' }));
      // room.sendPlayersOnline()
      // room.broadcast(EtypeWss.JOINROOM, room.getRoomState());

      // ws.send(JSON.stringify({ type: 'roomState', payload: room.getRoomState() }));
      // } else {
      // user.
      // ws.send(JSON.stringify({ type: 'error', message: 'Sala no encontrada' }));
   }

   private leaveRoom(roomId: string, ws: WebSocket) {
      const room = this.rooms.get(roomId);
      if (!room) return;

      // Buscar al usuario por su conexión WebSocket
      const user = room.getPlayers().find(player => player?.connectionWs === ws);
      if (!user) return;

      // Marcar al usuario como "desconectado"
      user.connectionWs = undefined;
      console.log(`Usuario ${user.username} desconectado. Esperando reconexión...`);

      // Esperar 30 segundos antes de eliminar al usuario
      setTimeout(() => {
         if (!user.connectionWs) {
            room.removePlayer(user.id);
            console.log(`Usuario ${user.username} eliminado de la sala ${roomId} por inactividad.`);
         }
      }, 30000);
   }
}
