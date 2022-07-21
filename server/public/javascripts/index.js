document.addEventListener('DOMContentLoaded', function () {
    // Button chuyển trạng thái
    const buttonToRight = document.querySelector('.to-right')
    const buttonToLeft = document.querySelector('.to-left')

    buttonToRight.addEventListener('click', function(){
        document.querySelector('.login-container').style.display = 'none'
        buttonToLeft.style.display = 'block'

        document.querySelector('.register-container').style.display = 'block'
        buttonToRight.style.display = 'none'

        document.querySelector('.content-left').style.flex = 1
        document.querySelector('.content-right').style.flex = 5
    })

    buttonToLeft.addEventListener('click', function(){
        document.querySelector('.login-container').style.display = 'block'
        buttonToLeft.style.display = 'none'

        document.querySelector('.register-container').style.display = 'none'
        buttonToRight.style.display = 'block'

        document.querySelector('.content-left').style.flex = 5
        document.querySelector('.content-right').style.flex = 1
    })
})

// Hàm xử lý đăng nhập
function login () {
    const username = document.querySelector('.login-username').value
    const password = document.querySelector('.login-password').value
    const announce = document.querySelector('.login-announce')

    console.log(username, password);

    // Nếu nhập thiếu thông tin đăng nhập
    if(!username || !password){
        announce.innerHTML = 'Bạn cần nhập đủ thông tin để đăng nhập'
    }

    // Ngược lại
    else{
        var xhttp = new XMLHttpRequest()

        // Hàm xử lý khi có response
        xhttp.onreadystatechange = function () {
            // Nhận thành công
            if (this.readyState == 4 && this.status == 200){
                const res = JSON.parse(this.responseText)

                // Xử lý response text
                if (res.status == 'success'){
                    console.log('Login success!')
                    const userid = res.userInfo.id
                    window.location = `/user/${userid}/home`
                }
                else{
                    console.log('Login fail!')
                    announce.innerHTML = res.message
                }
            }
        }

        xhttp.open('POST', '/login', true)
        xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhttp.send(`username=${username}&password=${password}`)
    }
}

// Hàm xử lý đăng ký
function register () {
    const username = document.querySelector('.register-username').value
    const password1 = document.querySelector('.register-password-1').value
    const password2 = document.querySelector('.register-password-2').value
    const name = document.querySelector('.register-name').value
    const avatar = document.querySelector('.register-avatar')
    const announce = document.querySelector('.register-announce')

    console.log(username, password1, password2, name)

    // Nếu không điền đủ thông tin
    if(!username || !password1 || !password2 || !name || !avatar.files){
        announce.innerHTML = 'Bạn cần nhập đủ thông tin để đăng ký!'       
    }

    // Nhập đủ thông tin
    else{
        // Nếu mật khẩu nhập lại không trùng khớp
        if(password1 != password2){
            announce.innerHTML = 'Mật khẩu nhập lại không khớp!'
        }

        // Thông tin chính xác
        else{
            const file = avatar.files[0] // Upload 1 file

            // Tạo form data
            const formdata = new FormData()
            formdata.append('username', username)
            formdata.append('password', password1)
            formdata.append('name', name)
            formdata.append('avatar', file)
            
            // gửi request lên server
            var xhttp = new XMLHttpRequest()
            
            xhttp.onreadystatechange = function(){
                // Gửi request và nhận response thành công
                if(this.readyState == 4 && this.status == 200){
                    const res = JSON.parse(this.responseText)
                    if(res['status'] == 'success'){
                        console.log("Register success!");
                        announce.innerHTML = 'Đăng ký thành công!'
                    }
                    else{
                        console.log('Register fail!');
                        announce.innerHTML = res['message']
                    }
                }
            }

            xhttp.open('POST', '/register', true)
            xhttp.send(formdata)
        }
    }
}  