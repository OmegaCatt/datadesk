const video=document.getElementById('atlas-video');
document.getElementById('play-atlas').addEventListener('click',async()=>{video.scrollIntoView({block:'center'});try{await video.play()}catch{video.focus()}});
function revealLinkedProject(){let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}const target=document.getElementById(id);if(!target)return;const parent=target.closest('details');if(parent){parent.open=true;target.scrollIntoView({block:'start'})}}
window.addEventListener('hashchange',revealLinkedProject);revealLinkedProject();
