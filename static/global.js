console.log("IT’S ALIVE!");

function $$ (selector, context = document) {
	return Array.from(context.querySelectorAll(selector));
}

document.body.insertAdjacentHTML("afterbegin", `
	<label class="color-scheme" >
		Theme:
		<select>
			<option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
		</select>
	</label>`
);


const select = document.querySelector("select")
select.addEventListener("input", function (event) {
    localStorage.colorScheme = event.target.value
    document.documentElement.style.setProperty("color-scheme", event.target.value);
});


let colorScheme = "colorScheme" in localStorage ? localStorage.colorScheme : "light dark";
select.value = colorScheme;
document.documentElement.style.setProperty("color-scheme", colorScheme);


const form = document.querySelector("form")
form?.addEventListener("submit", function (event) {
    event.preventDefault();
    const data = new FormData(form);
    let url = `${form.action}?`
    for (let [name, value] of data) {
        url += `${name}=${encodeURIComponent(value)}`;
    }
    location.href = url;
});
