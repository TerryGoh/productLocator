const api_url = "https://inec.sg/assignment/retrieve_records.php";

function displayPage(divID) {
    var pages = document.getElementsByClassName("page");

    for (var i = 0; i < pages.length; i++) {
        if (pages[i].id == divID) {
            pages[i].style = "display:block;";
        } else {
            pages[i].style = "display:none;";
        }
    };

    if (divID === "page_home")
        document.querySelector("#span_header_date").innerHTML = formattedDate();

    if (divID === "page_map")
        updateProductDetailInMap("")


}

/*
 
*/

function formattedDate(d = new Date) {
    let month = String(d.getMonth() + 1);
    let day = String(d.getDate());
    const year = String(d.getFullYear());

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    var hour = d.getHours();
    var mins = d.getMinutes();

    if (mins < 10) mins = '0' + mins;

    return `${day}/${month}/${year} ${d.getHours()}:${mins}`;
}

var setProductName = (name) => sessionStorage.productName = name;

var getProductName = () => sessionStorage.productName;

var display_productItem = (productItem) => {

    displayPage("page_details");

    console.log("productName == " + productItem.name);

    setProductName(productItem.name);

    var itemResult =
        `<div id="div_product_details_img">
        <img src="${productItem.image}"></div>
    <div id="div_product_details_data">
        <div class="div_product_details_data_cell">
            <span class="product_details_data_name">Brand</span><br>${productItem.brand}
        </div>
        <div class="div_product_details_data_cell">
            <span class="product_details_data_name">Type</span><br>${productItem.type}
        </div>
        <div class="div_product_details_data_cell">
            <span class="product_details_data_name">Install?</span><br>${productItem.installation}
        </div>
        <div class="div_product_details_data_cell">
            <span class="product_details_data_name">Price</span><br>$${productItem.price}
        </div>` ;

    // update back page
    document.querySelector("#product_name").innerHTML = productItem.name;

    document.querySelector("#div_product_details").innerHTML = itemResult;
}

var display_productList = (productArray) => {
    var itemResult = "";

    // store into the localStorage
    localStorage["productList"] = JSON.stringify(productArray);

    for (let i = 0; i < productArray.length; i++) {
        let item = productArray[i];
        console.log(item);
        itemResult += `<li class="li_product_item" id="product_${i}">
        <div class="li_product_image"><img src=${item.image}></div>
        <div class="li_product_name">${item.brand}, ${item.name}<br><span class="li_product_price">$${item.price}</span></div>
        </li>`
    }

    document.querySelector("#ul_products_list").innerHTML += itemResult;

    for (let i = 0; i < productArray.length; i++) {
        document.querySelector(`#product_${i}`).addEventListener('click',
            () => { console.log("*****Is here ****"); display_productItem(productArray[i]); }, false);
    }
}

var currPostion = (latLng) => { return { lat: latLng.lat(), lng: latLng.lng() } };

var getProductImage = (productName) => {

    var productArray = JSON.parse(localStorage["productList"]);

    for (let i = 0; i < productArray.length; i++) {
        if (productArray[i].name === productName)
            return productArray[i].image;
    }

    return -1;
}

var loadProductIcon = (imgUrl) => {

    var icon = {
        url: imgUrl, // url
        scaledSize: new google.maps.Size(50, 50), // size
    };
    return icon;
}

var getProductMarkers = (productName) => {

    var allMarkers;

    if (!localStorage[productName] == false) {
        allMarkers = JSON.parse(localStorage[productName]);
        if (!allMarkers)
            return allMarkers;
    }
    else return null;

    return allMarkers.filter(function (item) {
        return item.name === productName;
    });
}


var createMapMarker = (productName, position) => {

    console.log("--createMapMarker--")
    var imgUrl = getProductImage(productName);
    var marker = new google.maps.Marker({
        position: position,
        map: getMap(),
        icon: loadProductIcon(imgUrl),
        label: productName

    });
    marker.location = position;
    marker.addListener('click', delMarkerCB);
    return marker;
}

var printMarkers = (myMarkers) => {
    myMarkers.forEach(function (element) {
        console.log(JSON.stringify(element));
    });
}

function delMarkerInLocalStore(productName, currentPos) {
    var markers = getProductMarkers(productName);

    var idx = markers.findIndex(function (item) {
        return (currentPos.lat == item.location.lat) &&
            (currentPos.lng == item.location.lng);
    });

    if (idx == -1)
        return false;

    markers.splice(idx, 1)
    localStorage[productName] = JSON.stringify(markers);

    return true;
}

function delUIMarker(productName, currentPos) {
    var UImarkers = getUIMarkersArray(productName);
    var idx = UImarkers.findIndex(function (item) {
        return (currentPos.lat == item.location.lat) &&
            (currentPos.lng == item.location.lng);
    });
    UImarkers[idx].setMap(null);
    UImarkers.splice(idx, 1);

    updateProductCounts(productName);
}

function delMarkerCB(event) {
    console.log("delMarkerCB");
    var productName = getCurrentProductName();
    if (!delMarkerInLocalStore(productName, currPostion(event.latLng)))
        return;
    send_message_to_all_clients({ name: productName, location: currPostion(event.latLng) }, 'Del-Marker');
}

function addMarkerInLocalStore(productName, currentPos) {
    let markers = [];

    console.log("1.  addMarker");

    if (!localStorage[productName]) {
        localStorage[productName] = JSON.stringify(markers);
        console.log("1.   create UImarkers here")
    }
    else {
        markers = getProductMarkers(productName);
        console.log("3.  create UImarkers here");
    }

    // each marker name and location to be store in localStorage
    markers.push({ name: productName, location: currentPos })
    localStorage[productName] = JSON.stringify(markers);

}

function addUIMarker(productName, currentPos) {
    // each marker name and location to be store in UIMarkersArray
    let UImarkers = [];
    var marker = createMapMarker(productName, currentPos);

    if (getCurrentProductName() !== productName)
        marker.setMap(null);

    UImarkers = getUIMarkersArray(productName);
    UImarkers.push(marker);
    getMap().UImarkers[productName] = UImarkers;

    updateProductCounts(productName);
}


function addMarkerCB(event) {
    console.log("addMarkerCB");
    var productName = getCurrentProductName();

    var myPos = currPostion(event.latLng);
    addMarkerInLocalStore(productName, myPos);
    send_message_to_all_clients({ name: productName, location: myPos }, 'Add-Marker');
}

function send_message_to_all_clients(msg, channelName) {
    const channel = new BroadcastChannel(channelName);
    console.log(msg);
    channel.postMessage(msg);
}


const markerOperator = { "Add-Marker": addUIMarker, "Del-Marker": delUIMarker };

var getCurrentPosition = () => {
    let mapPosition;

    navigator.geolocation.getCurrentPosition((position) => {
        mapPosition = { lat: position.coords.latitude, lng: position.coords.longitude };
    });

    return mapPosition;
}

var createMap = (mapPosition) => {

    var map = getMap();

    console.log(mapPosition);

    if (!map) {
        console.log("create Map here")
        map = new google.maps.Map(div_product_map, {
            center: mapPosition,
            zoom: 15
        });
        map.addListener('click', addMarkerCB);

        // store map
        div_product_map.map = map;
    }
    console.log(map)
    return map;
}

var updateProductCounts = (productName) => {


    if (productName === "") {
        document.querySelector("#num_loc").innerHTML = "";
        return;
    }

    var myProductName = getCurrentProductName()
    if (myProductName === productName) {

        var totalProducts = getUIMarkersArray(productName).length;
        console.log("totalProducts == " + totalProducts);
        if (totalProducts > 0)
            document.querySelector("#num_loc").innerHTML = totalProducts + " locations";
        else
            document.querySelector("#num_loc").innerHTML = "";

    }

}

var updateProductDetailInMap = (productName) => {

    document.querySelector("#prod_img").src = getProductImage(productName);

    updateProductCounts(productName);
}

function initMap() {

    navigator.geolocation.getCurrentPosition((position) => {

        var mapPosition = { lat: position.coords.latitude, lng: position.coords.longitude };

        var map = createMap(mapPosition);

        var marker = new google.maps.Marker({
            position: mapPosition,
            map: map
        });

        loadProductsLocations();

        var productName = getProductName();
        updateProductDetailInMap(productName);
    });
}


function AjaxLoadMessage() {

    var settingsObject = {
        dataType: "json",
        method: "GET"
    };

    $.ajax(api_url, settingsObject)
        .done(function (returnObject) {
            //  console.log(returnObject) ;
            display_productList(returnObject.products);
        })
        .fail(function (errorObject) {
            console.log(errorObject)
        })
        .always(function () {
            //happens regardless what happens
        });
}


var loadProductsLocations = () => {

    var productName = getCurrentProductName();

    if (!localStorage[productName] == false) {
        var oldMarkerList = JSON.parse(localStorage[productName]);
        console.log("oldMarkerList == " + oldMarkerList);

        let UImarkers = getUIMarkersArray(productName);


        if (oldMarkerList.length > 0 && UImarkers.length == 0) {
            console.log("Need to create UIMarkers here")
            for (let i = 0; i < oldMarkerList.length; i++) {

                let marker = createMapMarker(oldMarkerList[i].name, oldMarkerList[i].location);

                UImarkers.push(marker);
            }
            console.log("1. Total UImarkers " + getMap().UImarkers[productName].length);

            if (oldMarkerList.length == getUIMarkersArray(productName).length) {
                console.log("2. Total UImarkers " + getMap().UImarkers[productName].length);
                console.log("UIMarkerArray Fully Updated!!");
            }
        }
        else if (oldMarkerList.length > 0 && oldMarkerList.length == UImarkers.length) {
            console.log("Map Markers in sync with local Storage!!")
        }
    }

    if (getMap() !== undefined)
        displayMarkersOnMap(getMap(), productName);

}

var getMap = () => {
    var div_product_map = document.getElementById("div_product_map");
    return div_product_map.map
}

var getUIMarkersArray = (productName) => {
    console.log(" ^^^^ " + getMap());
    if (!getMap()) {
        return null;
    }
    if (!getMap().UImarkers) {
        console.log("create UIMarker Array here");
        console.log(productName);
        getMap().UImarkers = new Object();
    }

    if (!getMap().UImarkers[productName])
        getMap().UImarkers[productName] = [];

    return getMap().UImarkers[productName];
}

var getCurrentProductName = () => sessionStorage.productName;

var displayMarkersOnMap = (map, productName) => {
    var markersArray = getUIMarkersArray(productName);
    if (!markersArray)
        return null;
    console.log("---displayMarkersOnMap---");
    console.log(markersArray);
    console.log(productName);
    if (markersArray.length > 0) {
        for (let i = 0; i < markersArray.length; i++) {
            markersArray[i].setMap(map);
        }
    }
}

var saveProductsLocations = () => {
    var productName = getCurrentProductName();
    console.log("----saveProductsLocations-----")

    google.maps.Map.prototype.clearOverlays = function () {
        console.log("clear all markers on map here!!")
        displayMarkersOnMap(null, productName);
    }

    getMap().clearOverlays();

}

function AjaxInit() {

    AjaxLoadMessage();
}

var getProductNameArray = () => {
    var productArray = JSON.parse(localStorage["productList"]);
    if (!productArray)
        return null;

    var productNameArray = [];

    for (let i = 0; i < productArray.length; i++)
        productNameArray.push(productArray[i].name);

    return productNameArray;
}


var initMarkerChannel = (channelName) => {
    const markerChannel = new BroadcastChannel(channelName);

    markerChannel.addEventListener('message', event => {
        console.log(`${channelName} : `, new Date(), ": ", event.data);
        markerOperator[channelName](event.data.name, event.data.location)
    });
}

var initServiceWorkerForClient =() => {
    if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
    }

    navigator.serviceWorker.register('service-worker.js')
        .then(() => {
            console.log('Registered Service Worker');
            //subscribePushNotification(); //taken away in ex. 3 to subscribe on click of button

            subscribePushNotification();

        })
        .catch(error => {
            console.log("Registering of Service Worker Failed: " + error);
        });

    //START - Ex 4 add handler to receive message from Service Worker
    navigator.serviceWorker.addEventListener("message", function (event) {
        console.log("[Client] Received From Service Worker: " + event.data);
        //alert(event.data);
    });

}

var indexPage = () => {

    initServiceWorkerForClient() ;
 
    AjaxInit();

    initMarkerChannel('Add-Marker');
    initMarkerChannel('Del-Marker');

    document.querySelector("#btn_product_details_back").addEventListener('click',
        () => { console.log(""); displayPage("page_home") }, false);


    document.querySelector("#btn_product_map_back").addEventListener('click',
        () => { saveProductsLocations(); displayPage("page_details") }, false);

    document.querySelector("#div_product_details_footer").addEventListener('click',
        () => { console.log("**** here ****"); initMap(); displayPage("page_map") }, false);

    displayPage("page_home");

}

function subscribePushNotification() {
    console.log("subscribePushNotification") ;
    navigator.serviceWorker.ready.then(function (registration) {
        //Check if Push Notification function exists in browser
        if (!registration.pushManager) {
            alert("Push Notification not supported in browser!");
            return;
        }

        registration.pushManager.subscribe(
            { userVisibleOnly: true } //always show notification when received from server
        )
            .then(function (subscription) {
                console.log(subscription);
                saveSubscriptionID(subscription);
            }
            )
            .catch(function (error) {
                console.log(error);
            }
            );
    });
}





