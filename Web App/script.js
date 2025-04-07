function msg() {
  document.getElementById("show").style.top = "0px";
}
function msg2() {
  document.getElementById("show").style.top = "-610px";
}

// Smooth Scroll for Navigation
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener("click", function (e) {
          e.preventDefault();
          
          const targetId = this.getAttribute("href").substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
              window.scrollTo({
                  top: targetElement.offsetTop - 50, // Adjust based on navbar height
                  behavior: "smooth"
              });
          }
      });
  });
});

function downloadApp() {
  const link = document.createElement("a");
  link.href = "https://drive.google.com/uc?export=download&id=1Jjmz9X5nKqR-1D_ftkJxXi2EJLQH1iBz";
  link.download = "InstaRoom.apk"; // Pangalan ng file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
