
import 'module-alias/register';

import { createServer } from 'http';
import { envs } from '@/config/envs';
import { WssService } from '@/application/service';
import { Server } from '@/presentation/server';
import { AppRoutes } from '@/presentation/router';

const main = () => {

   const server = new Server({
      port: envs.PORT,
   });

   const httpServer = createServer(server.app);

   WssService.initWss({ server: httpServer });

   server.setRoutes(AppRoutes.routes);

   httpServer.listen(envs.PORT, () => {
      console.log(`Server running on port: ${envs.PORT}`);
   })
}


(async () => {
   main();
})();
