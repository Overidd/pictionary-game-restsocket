import { UserEntity } from '@/domain/entity/user.entity';
import { UserRegisterDTO } from '../dto';
import { CustomError } from '../error';
import { WssService } from './wss.service';

export class UserService {
   private static _instance: UserService;
   private users: Map<string, UserEntity> = new Map(); // Almacena usuarios por ID

   private constructor(
      private readonly wssService = WssService.instance
   ) { }

   // Obtener la instancia única del Singleton
   static get instance(): UserService {
      if (!UserService._instance) {
         UserService._instance = new UserService();
      }
      return UserService._instance;
   }

   // Registrar un usuario nuevo
   public async register(userDto: UserRegisterDTO) {

      this.users.forEach((user) => {
         if (user.username === userDto.username && user.ip === userDto.ip) {
            throw CustomError.badRequest('El nombre de usuario ya existe.');
         }
      })

      const newUser = UserEntity.fromObject(userDto);
      this.users.set(newUser.id, newUser);

      // this.wssService.sendMessage('newUser', newUser);
      return newUser
      // return {
      //    id: newUser.id,
      //    rooms: Promise.resolve(this.wssService.getRooms())
      // };
   }

   // Obtener todos los usuarios registrados
   public async getAll(): Promise<UserEntity[]> {
      return Array.from(this.users.values());
   }

   // Buscar un usuario por ID
   public async getById(id: string): Promise<UserEntity | undefined> {
      return this.users.get(id);
   }

   // Eliminar un usuario por ID
   public async remove(id: string): Promise<boolean> {
      return this.users.delete(id);
   }
}
