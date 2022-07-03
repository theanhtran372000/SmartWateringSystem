module.exports = {
    getCurrentDateString: function() {
        const date = new Date()
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    },
    getDateDiffInSec: function(date1, date2){
        return Math.abs(date2 - date1) / 1000
    } 
}