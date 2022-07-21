document.addEventListener('DOMContentLoaded', function () {
    // Button submit
    const buttonAdd = document.querySelector('.content-left-add-tree-button button')

    // Xử lý nút bấm
    buttonAdd.addEventListener('click', function () {

        // Dữ liệu đầu vào
        const type = document.querySelector('.content-left-add-tree-name input').value
        const id = document.querySelector('.content-left-add-tree-id input').value
        const image = document.querySelector('.content-left-add-tree-avatar input')
        const description = document.querySelector('.content-left-add-tree-description input').value
        const announce = document.querySelector('.content-left-add-tree-announce p')

        // Kiểm tra dữ liệu
        if (!type || !id || !image.files || !description){
            announce.innerHTML = 'Bạn cần nhập đủ thông tin!'
        }

        else{
            const file = image.files[0]
            const userid = document.querySelector('.content-left-user-info-id span').innerHTML

            const formdata = new FormData()
            formdata.append('userid', userid)
            formdata.append('type', type)
            formdata.append('id', id)
            formdata.append('image', file)
            formdata.append('description', description)

            // Tạo HTTP request
            const xhttp = new XMLHttpRequest()

            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200){
                    const res = JSON.parse(this.responseText)

                    if (res.status == 'success'){
                        console.log('Add success!')
                        announce.innerHTML = 'Thêm mới thành công!'
                        updateTreeList()
                    }

                    else{
                        console.log('Add fail!')
                        announce.innerHTML = res.message
                    }
                }
            }

            xhttp.open('POST', '/addTree', true)
            xhttp.send(formdata)
        }
    })
})

// Cập nhật lại danh sách cây
function updateTreeList(){
    const userid = document.querySelector('.content-left-user-info-id span').innerHTML

    // Lấy danh sách cây
    const xhttp = new XMLHttpRequest()

    xhttp.onreadystatechange = function () {
        // Thành công
        if (this.readyState == 4 && this.status == 200){
            const res = JSON.parse(this.responseText)

            if (res.status == 'success'){
                console.log('Reload list tree success!')

                const data = res.data

                var str = ''

                // Update lên giao diện
                data.forEach(element => {
                    str += `
                    
                    <div class="content-right-tree">
                        <div onclick="showDetail(this)" class="content-right-tree-content">
                            <div class="content-right-tree-left">
                                <img src="${element.image}" alt="" class="content-right-tree-avatar">
                            </div>
                            
                            <div class="content-right-tree-right">
                                <p class="content-right-tree-name">${element.type}</p>
                                <p class="content-right-tree-id">ID <span>${element.id}</span></p>
                                <p class="content-right-tree-description">${element.description}</p>
                            </div>
                        </div>
                        <div onclick="deleteTree()" class="content-right-tree-delete">
                            <i class="fas fa-2x fa-solid fa-trash"></i>
                        </div>
                    </div>

                    `
                });

                const treeContainer = document.querySelector('.content-right-list-tree-body')
                treeContainer.innerHTML = str
            }
            else{   
                console.log('Reload list tree fail!')
            }
        }
    }

    xhttp.open('POST', '/getTreeList', true)
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`userid=${userid}`)
}

function deleteTree(button){
    const treeId = button.parentNode.querySelector('.content-right-tree-id span').innerHTML
    
    // Gọi API xóa
    const xhttp = new XMLHttpRequest()

    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200){
            const res = JSON.parse(this.responseText)

            if (res.status == 'success'){
                console.log('Delete success!')

                updateTreeList()
            }

            else{
                console.log('Delete fail!')
            }
        }
    }

    xhttp.open('POST', '/deleteTree', true)
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    xhttp.send(`treeId=${treeId}`)
}

// Xem thông tin chi tiết
function showDetail(element){
    const treeId = element.querySelector('.content-right-tree-id span').innerHTML
    const userid = document.querySelector('.content-left-user-info-id span').innerHTML

    window.location = window.location = `/user/${userid}/tree/${treeId}`
}