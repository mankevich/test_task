export { dateFormat };

function dateFormat(dateToFormat) {
  if(dateToFormat === null) return null

  let date = new Date(dateToFormat);

  let day = date.getDate();
  if((String(day)).length < 2) {
    day = '0' + day;
  }

  let month = date.getMonth()+1
  if((String(month)).length < 2) {
    month = '0' + month;
  }

  let year = date.getFullYear();

  let hours = date.getHours();
  if((String(hours)).length < 2) {
    hours = '0' + hours;
  }

  let minutes = date.getMinutes();
  if((String(minutes)).length < 2) {
    minutes = '0' + minutes;
  }

  let seconds = date.getSeconds();
  if((String(seconds)).length < 2) {
    seconds = '0' + seconds;
  }

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}
