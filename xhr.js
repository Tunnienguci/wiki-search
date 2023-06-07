// KHAI BÁO DOM
const searchInput = document.getElementById("inputSearch");
const list = document.querySelector("#results");
let isLoading = false;

//KHAI BÁO API
const API_SEARCH = `https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&limit=10&format=json&search=`;
const API_THUMBNAIL = `https://en.wikipedia.org/w/api.php?origin=*&action=query&prop=pageprops|pageimages&format=json&titles=`;

//HÀM DEBOUNCE CHẶN NGƯỜI DÙNG SPAM REQUEST
function debounce(func, wait) {
	let timeout;
	return function execute(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

//GET DATA TÁI SỬ DỤNG | XHR
function getData(url) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.onload = function () {
			if (xhr.status === 200) {
				resolve(JSON.parse(xhr.responseText));
			} else {
				reject(new Error("[ERROR Lỗi response: " + xhr.status));
			}
		};
		xhr.onerror = function () {
			reject(new Error("[ERROR] Lỗi Request: " + xhr.status));
		};
		xhr.send();
	});
}

//SPINNER LOADING
function setLoading(value) {
	isLoading = value;
	if (isLoading) {
		list.innerHTML = `<div class="loading"><div class="spinner-border text-primary" role="status"></div> Loading...</div>`;
	} else {
		list.innerHTML = "";
	}
}


//XỬ LÝ SEARCH
const handleSearch = debounce(async (e) => {
	let html = "";
	const query = e.target.value;
    console.log(query)
	if (!query) {
		setLoading(false);
		return;
	}
	try {
        if(!query || query.trim() == '')  //Khi không có tìm kiếm hoặc khoảng trắng thì không gửi request
        {
            setLoading(false)
            return
        }
        setLoading(true);  //Check khoảng trắng thì không load
        const searchResponse = await getData(API_SEARCH + query);
        const titles = searchResponse[1];
        const thumbnailResponses = await Promise.all(
            titles?.map(async (title) => await getData(API_THUMBNAIL + title))
        );
        thumbnailResponses.forEach((thumbnailResponse, index) => {
            const pageId = Object.keys(thumbnailResponse.query.pages)[0];
            if (!pageId) {
                return;
            }
            const page = thumbnailResponse.query.pages[pageId];
            const thumbnail = page.thumbnail;
            const desc = page.pageprops?.["wikibase-shortdesc"] || "We dont have any description !";
            html += createListItem(
                titles[index],
                thumbnail?.source,
                desc,
                searchResponse[3][index]
            );
        });
	} catch (error) {
		console.log("[TuanQC is checking with] : " + error);
	} finally {
		setLoading(false);
		if (html) {
			list.innerHTML = html; //In ra data khi có
		}
        else if(!query.trim()){
            list.innerHTML = ``;   //Không in gì khi không có ký tự trong input
        }
        else  
            list.innerHTML = `<div class="alert alert-warning m-0 text-center" role="alert">I didn't find the information you were looking for!</div>`; //In ra khi không có data
	}
});

// ĐỊNH DẠNG HTML 
function createListItem(title, thumbnailSource, description, link) {
	return `
    <li data-link=${link} class="list-group-item p-0 d-flex align-items-center">
        <div class="p-0 me-3">
            <img src="${thumbnailSource || "https://png.pngtree.com/png-vector/20190820/ourlarge/pngtree-no-avatar-vector-isolated-on-white-background-png-image_1694546.jpg"}">
        </div>
        <div class="p-0">
            <h4>${title}</h4>
            <p class="text-dark">${description} </p>
        </div>
    </li>
    `;
}

//XỬ LÝ SỰ KIỆN LINK ĐIỀU HƯỚNG KHI CHỌN
list.addEventListener("click", function (e) {
	const link = e.target.closest("li").dataset.link;
	window.open(link, "_blank");
});

//XỬ LÝ KHI SEARCH 
searchInput.addEventListener("keyup", debounce(handleSearch, 1000));
