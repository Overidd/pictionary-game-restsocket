export class IntervalUtil {


   static interval(
      callback: (time: number) => void,
      timeInterval = 1000,
      timeOut = 5
   ) {
      return new Promise((resolve) => {
         let timer = 0;
         const interval = setInterval(() => {
            timer += timeInterval;
            callback((timeOut * 1000 - timer) / 1000); // Enviar tiempo restante en segundos
            if (timer >= timeOut * 1000) {
               clearInterval(interval);
               resolve(true);
            }
         }, timeInterval);
      });
   }
}
// export class IntervalUtil {
//    static interval(
//       callback: (timeLeft: number) => void,
//       timeInterval = 1000,
//       timeOut = 5
//    ) {
//       let timer = 0;
//       let interval: NodeJS.Timeout;

//       const promise = new Promise<boolean>((resolve) => {
//          interval = setInterval(() => {
//             timer += timeInterval;
//             const timeLeft = (timeOut * 1000 - timer) / 1000;
//             callback(timeLeft);

//             if (timer >= timeOut * 1000) {
//                clearInterval(interval);
//                resolve(true);
//             }
//          }, timeInterval);
//       });

//       return {
//          stop: () => clearInterval(interval),
//          promise,
//       };
//    }
// }
