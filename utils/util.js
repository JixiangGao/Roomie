const formatTime = date => {
  if (!date) {
    date = new Date();
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
function formatDistance(distance) {
  distance = +distance;
  return distance < 1000 ? Math.round(distance) + 'm' : (distance / 1000).toFixed(1) + 'km';
}

function isPlainObject(obj) {
  for (var name in obj) {
    return false;
  }
  return true;
}

function isPhoneNumber(num) {
  return /^1\d{10}$/.test(num);
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

module.exports = {
  formatTime: formatTime,
  isPlainObject: isPlainObject,
  isPhoneNumber: isPhoneNumber,
  formatDistance: formatDistance

}
