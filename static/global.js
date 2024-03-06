console.log("IT’S ALIVE!");

function $$ (selector, context = document) {
	return Array.from(context.querySelectorAll(selector));
}

let pages = [
    {url: "./", title: "Home"},
    {url: "projects", title: "Projects"},
    {url: "contact", title: "Contact"},
    {url: "cv", title: "Resume"},
    {url: "https://github.com/gracefh", title: "GitHub"}
];

let nav = document.createElement("nav");
document.body.prepend(nav);

for (const p of pages) {
    let url = p.url;
    let title = p.title;

    let a = document.createElement("a");
    a.href = url;
    a.textContent = title;
    a.classList.toggle("current", a.host === location.host && a.pathname === location.pathname);
    a.target = a.host !== location.host ? "_blank" : "";
    nav.append(a);
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
