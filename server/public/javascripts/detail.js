document.addEventListener('DOMContentLoaded', function () {
    const interval = 3000 // ms

    // Auto update dữ liệu
    setInterval(function () {
        // Update dữ liệu
        const xhttp = new XMLHttpRequest()

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200){
                const res = JSON.parse(this.responseText)

                if (res.status == 'success'){
                    console.log('Update data success!')
                    
                    // Cập nhật dữ liệu lên giao diện
                    document.querySelector('.content-left-top-content-left p:last-child').innerHTML = res.humi
                    document.querySelector('.content-left-top-content-middle p:last-child').innerHTML = res.water

                    const container = document.querySelector('.content-left-top-content-right')
                    if (res.pumpState == 1){
                        container.innerHTML = `
                        <p>Trạng thái bơm</p>
                        <p style="color: #2ecc71">Bật</p>
                        `
                    }
                    else{
                        container.innerHTML = `
                        <p>Trạng thái bơm</p>
                        <p style="color: #e74c3c">Tắt</p>
                        `
                    }
                }
                else{
                    console.log('Update data fail!')
                    console.log('Message: ', res.message)
                }
            }
        }

        const treeid = document.querySelector('.content-left-header-content-id').innerHTML

        xhttp.open('POST', '/getLatestData', true)
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        xhttp.send(`treeid=${treeid}`)
    }, interval)
})

// Cập nhật thông số mặc định
function updateDefault(){
    const ele = document.querySelectorAll('.content-left-bottom-item-content input')

    // Giá trị mặc định mới
    const duration = ele[0].value
    const threshold = ele[1].value

    const oldValues = document.querySelectorAll('.content-left-bottom-item-content p span')
    const announce = document.querySelector('.content-left-bottom-announce')

    if (duration == oldValues[0].innerHTML && threshold == oldValues[1].innerHTML){
        announce.innerHTML = 'Bạn chưa thực hiện thay đổi!'
    }
    else{
        const xhttp = new XMLHttpRequest()

        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200){
                const res = JSON.parse(this.responseText)

                if (res.status == 'success'){
                    console.log('Update default success!')
                    announce.innerHTML = 'Cập nhật thành công!'

                    // Update lên giao diện
                    oldValues[0].innerHTML = duration
                    oldValues[1].innerHTML = threshold
                }
                else{
                    console.log('Update default fail!')
                    announce.innerHTML = res.message
                }
            }
        }

        const treeid = document.querySelector('.content-left-header-content-id').innerHTML

        xhttp.open('POST', '/updateDefault', true)
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
        xhttp.send(`treeid=${treeid}&duration=${duration}&threshold=${threshold}`)
    }

}   

// Tưới theo yêu cầu
function startWatering(){
    const duration = document.querySelector('.content-right-top-content input').value

    watering(duration)
}

// Tưới mặc định
function defaultWatering() {
    const duration = document.querySelectorAll('.content-left-bottom-item-content input')[0].value

    watering(duration)
}

// Hàm tưới
function watering(duration){
    const treeid = document.querySelector('.content-left-header-content-id').innerHTML
    const announce = document.querySelector('.content-right-top-announce')

    const xhttp = new XMLHttpRequest()

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200){
            const res = JSON.parse(this.responseText)

            if (res.status == 'success'){
                console.log('Update default success!')
                announce.innerHTML = 'Tưới thành công!'

                const pumpState = res.pumpState

                // Cập nhật trạng thái máy bơm
                const container = document.querySelector('.content-left-top-content-right')

                if (pumpState == 1){
                    container.innerHTML = `
                    <p>Trạng thái bơm</p>
                    <p style="color: #2ecc71">Bật</p>
                    `
                }
                else{
                    container.innerHTML = `
                    <p>Trạng thái bơm</p>
                    <p style="color: #e74c3c">Tắt</p>
                    `
                }

                // Cập nhật lịch sử tưới
                updateHistory()
                
            }
            else{
                console.log('Update default fail!')
                announce.innerHTML = res.message
            }
        }
    }

    xhttp.open('POST', '/watering', true)
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`treeid=${treeid}&duration=${duration}`)
}

// Cập nhật lịch sử
function updateHistory() {
    
    const xhttp = new XMLHttpRequest()

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            const res = JSON.parse(this.responseText)

            if(res.status == 'success'){
                console.log('Update history success!')

                // Update giao diện lịch sử
                // Xóa thông tin cũ
                const container = document.querySelector('.content-right-bottom-container')
                container.innerHTML = ''

                // Thêm thông tin mới
                const data = res.data
                var str = ''
                data.forEach(element => {
                    str += `
                    <div class="content-right-bottom-item">
                            <div class="content-right-bottom-item-1">
                                <p>Ngày tưới</p>
                                <p>${element.date}</p>
                            </div>
                            <div class="content-right-bottom-item-2">
                                <p>Giờ tưới</p>
                                <p>${element.time}</p>
                            </div>
                            <div class="content-right-bottom-item-3">
                                <p>Thời gian tưới</p>
                                <p>${element.duration} ms</p>
                            </div>
                        </div>
                    `
                })

                container.innerHTML = str
            }
            else{
                console.log('Update history fail!')
            }
        }
    }

    const treeid = document.querySelector('.content-left-header-content-id').innerHTML

    xhttp.open('POST', '/getHistory', true)
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`treeid=${treeid}`)

}