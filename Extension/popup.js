document.getElementById("btn").onclick = () => {
    document.getElementById("result").textContent =
        "Número random: " + Math.floor(Math.random() * 1000);
};
