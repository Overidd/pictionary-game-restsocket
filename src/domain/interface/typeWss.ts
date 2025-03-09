

export enum EtypeWss {
   JOINROOM = 'joinRoom',
   LEAVEROOM = 'leaveRoom',
   CREATEROOM = 'createRoom',
   NEWROOM = 'newRoom',
   ROOM_STATE = 'roomState',
   ROOMS = 'rooms',

   PLAYERS_ONLINE_ROOM = 'PlayersOnlineRoom', // Para recibir los jugadores de la sala
   REQUEST_ROOM_DATA = 'requestRoomData', // Cuando el jugador solicita los datos de la sala

   PLAYERS_QUANTITY_ONLINE_ROOM = 'playersQuantityOnlineRoom', // Para recibir la cantidad de jugadores en la sala

   IS_PLAYER_CREATOR_ROOM = 'isPlayerCreatorRoom', // Para saber si el usuario creo la sala

   START_GAME = 'startGame',   // Para iniciar el juego

   READY_GAME = 'readyToPlay', // Para saber si el usuario esta listo para jugar

   ERROR_START_GAME_ROOM = 'errorStartGameRoom', // Para saber al menos un jugador esta listo para jugar

   START_GAME_ROOM_OK = 'startGameRoomOk', // Para iniciar el juego

   INTERVAL_START_GAME_ROOM = 'intervalStartGameRoom', // Para iniciar el juego

   WORD_SELECTED_ROOM = 'wordSelectedRoom', // Para recibir la palabra seleccionada por el jugador

   ROOM_STATE_GAME = 'roomStateGame', // Para recibir el estado del juego

   SELECT_WORD = 'selectWord', // Cuando el usuario selecciona una palabra

   CURRENT_ROUND_TIME_ROOM = 'currentRoundTimeRoom', // Para recibir el tiempo restante de la ronda

   // BASE64_IMAGE_ROOM = 'canvasDrawn', 
   CANVAS_IMAGE_ROOM = 'canvasImageRoom', // Para recibir la imagen dibujada por el jugador y enviarla a todos los jugadores de la sala

   CHAT_MESSAGE_ROOM = 'chatMessageRoom', // Para recibir los mensajes del chat

   NEXT_ROUND_ROOM = 'nextRoundRoom', // Para recibir los mensajes del chat
   END_GAME_ROOM = 'endGameRoom',

   EXIT_ROOM = 'exitRoom', // Para salir de la sala
}