
  document.getElementById("searchBtn").addEventListener("click", async () => {
    const query = document.getElementById("searchInput").value.trim();
    console.log(query)

    if (query){
        window.location.href = `/shop?search=${encodeURIComponent(query)}`;
    }

   
  });
