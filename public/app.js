const API = "https://room-booking-api-ca1g.onrender.com";

// register
function register() {
  fetch(API + "/api/register", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      username: username.value,
      email: email2.value,
      password: password2.value
    })
  }).then(()=>alert("สมัครสำเร็จ"));
}

// login
function login() {
  fetch(API + "/api/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  })
  .then(res=>res.json())
  .then(data=>{
    localStorage.setItem("user", data.id);
    location.href="rooms.html";
  });
}

// โหลดห้อง
function loadRooms(){
 fetch(API+"/api/rooms")
 .then(res=>res.json())
 .then(data=>{
  rooms.innerHTML="";
  data.forEach(r=>{
    rooms.innerHTML+=`
      <div>
        ห้อง ${r.room_number} - ${r.price} บาท
        <button onclick="book(${r.id},${r.price})">จอง</button>
        <button onclick="deleteRoom(${r.id})">ลบ</button>
      </div>
    `;
  });
 });
}

// ลบห้อง
function deleteRoom(id){
 fetch(API+"/api/rooms/"+id,{
  method:"DELETE"
 }).then(()=>loadRooms());
}

// จอง
function book(id, price) {
  const nights = prompt("กี่คืน?");
  const total = nights * price;

  fetch(API + "/api/bookings", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      user_id: localStorage.getItem("user"),
      room_id: id,
      check_in_date:"2025-01-01",
      check_out_date:"2025-01-02",
      total_price: total
    })
  }).then(()=>alert("จองสำเร็จ"));
}