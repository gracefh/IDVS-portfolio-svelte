<section class="narrative" bind:this={container}>
	<section class="story">
		<slot />
	</section>
	<section class="viz" bind:this={vizContainer}>
		<slot name="viz" />
	</section>
</section>

<svelte:window bind:innerHeight={viewportHeight} />

<style>
.narrative {
	position: relative;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 4em;

	.story {

	}

	.viz {
		position: sticky;
		top: 0;
		max-height: 100vh;
	}
}
</style>

<script>
import * as d3 from "d3";
import { onMount } from "svelte";
export let progress = 0;
export let unclampedProgress = 0;
export let threshold = 0.5;
export let margin = "0px";

let container, vizContainer;
let scrollTop = 0;

let minTop, viewportHeight, rect = {};
let maxTop;
let unclampedProgressScale;
let progressScale;

let intersectionObserver, resizeObserver;
onMount(() => {
	intersectionObserver = new IntersectionObserver(entries => {
		let lastEntry = entries.at(-1);
		intersectionRatio = lastEntry.intersectionRatio;

		if (lastEntry.isIntersecting) {
			handleResize();
			handleScroll();
			window.addEventListener('scroll', handleScroll);
			window.addEventListener('resize', handleResize);
			resizeObserver?.observe(container);
		}
		else {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleResize);
			resizeObserver?.unobserve(container);
		}
	});

	intersectionObserver.observe(container, {
		rootMargin: margin,
		threshold: threshold
	});

	resizeObserver = new ResizeObserver(handleResize);

	function handleScroll () {
		let root = document.documentElement;
		rect = container.getBoundingClientRect();

		unclampedProgress = unclampedProgressScale(scrollTop);

		progress = progressScale(rect.top);
		console.log(progress, unclampedProgress, rect.top, "[", minTop, maxTop , "]")
	}

	function handleResize () {
		let root = document.documentElement;
		rect = container.getBoundingClientRect();
		// minTop = root.scrollTop + rect.top;
		minTop = viewportHeight * threshold;
		maxTop = -rect.height + viewportHeight;
		unclampedProgressScale = d3.scaleLinear([minTop, maxTop], [0, 100]);
		progressScale = unclampedProgressScale.clamp(true);
	}

	handleResize();
	handleScroll();
});

let intersectionRatio = 0;
</script>