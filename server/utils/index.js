module.exports = {
    getCurrentDateString: function() {
        const date = new Date()
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
    },
    getDateDiffInSec: function(date1, date2){
        return Math.abs(date2 - date1) / 1000
    },
    generateRandomString: function (){
        return Array.from(Math.random().toString(16)).splice(3, 12).join("")
    },
    getSaveString: function (){
        const date = new Date()
        return `${date.getFullYear()}_${this.formatDateString(date.getMonth() + 1)}_${this.formatDateString(date.getDate())}_${this.formatDateString(date.getHours())}_${this.formatDateString(date.getMinutes())}_${this.formatDateString(date.getSeconds())}_${this.generateRandomString()}.jpg` 
    },
    // Hiển thị số 2 ký tự
    formatDateString: function (dateString){
        return ("0" + dateString).slice(-2)
    },
    getDate: function(datetime){
        return `${this.formatDateString(datetime.getDate())}/${this.formatDateString(datetime.getMonth() + 1)}/${datetime.getFullYear()}`
    },
    getTime: function(datetime){
        return `${this.formatDateString(datetime.getHours())}:${this.formatDateString(datetime.getMinutes())}:${this.formatDateString(datetime.getSeconds())}`
    }
}