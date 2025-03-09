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
