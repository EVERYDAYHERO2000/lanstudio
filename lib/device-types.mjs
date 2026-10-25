export const deviceTypes = [
  ['other', 'Другое устройство'],
  ['computer', 'Компьютер'],
  ['laptop', 'Ноутбук'],
  ['camera', 'Камера'],
  ['nvr', 'Видеорегистратор'],
  ['microcontroller', 'Микроконтроллер'],
  ['smart-home', 'Устройство умного дома'],
  ['server', 'Сервер / NAS'],
  ['printer', 'Принтер'],
  ['tv', 'Телевизор'],
  ['phone', 'Смартфон'],
  ['sensor', 'Датчик']
];
/** @param {unknown} value */
export function validDeviceType(value) {
  return value === undefined || deviceTypes.some(([id]) => id === value);
}
