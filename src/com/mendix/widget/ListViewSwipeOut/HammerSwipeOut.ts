import * as Hammer from "hammerjs";
import * as domClass from "dojo/dom-class";
import * as domStyle from "dojo/dom-style";

interface SwipeOutOptions {
    afterSwipeAction: AfterSwipeAction;
    callback: (direction: Direction) => void;
    callbackDelay: number;
    foreComponentName: string;
    backComponentName: string;
    postSwipeComponentName?: string;
    swipeDirection: Direction | "horizontal";
    transparentOnSwipe?: boolean;
}

type Direction = "right" | "left";
type AfterSwipeAction = "remove" | "none";

class HammerSwipeOut {
    private container: HTMLElement;
    private foreComponent: HTMLElement;
    private containerSize: number;
    private containerClass: string;
    private hammer: HammerManager;
    private options: SwipeOutOptions;
    private swipedOut: boolean = false;
    private isScrolling: boolean = false;
    private backComponent: HTMLElement;
    private direction: number;
    private thresholdCompensation: number = 0;
    // Internal settings
    private thresholdScrolling: number = 30; // Pixels.
    private swipeAcceptThreshold: number = 20; // Percentage.
    private removeItemDelay: number = 600; // Milliseconds

    constructor(container: HTMLElement, options: SwipeOutOptions) {
        this.container = container;
        this.options = options;
        this.containerClass = this.container.className;
        this.containerSize = this.container.offsetWidth;
        this.direction = (Hammer as any)[`DIRECTION_${options.swipeDirection.toUpperCase()}`];

        this.hammer = new Hammer.Manager(this.container);
        this.hammer.add(new Hammer.Pan({
            direction: this.direction
        }));
        this.hammer.on("panstart panmove panend pancancel", event => this.onPan(event));

        this.setUpPanes(options);
        this.registerExtraEvents();
    }

    private setUpPanes(options: SwipeOutOptions) {
        this.foreComponent = options.foreComponentName
            ? this.container.querySelector(`.mx-name-${options.foreComponentName}`) as HTMLElement
            : null;

        if (options.foreComponentName && !this.foreComponent) {
            throw new Error(`No component with the name ${options.foreComponentName} found`);
        }

        if (this.foreComponent) {
            domClass.add(this.foreComponent, "swipe-foreground");

            this.backComponent = options.backComponentName
                ? this.container.querySelector(`.mx-name-${options.backComponentName}`) as HTMLElement
                : null;
            if (options.backComponentName && !this.backComponent) {
                throw new Error(`No component with the name ${options.backComponentName} found`);
            }

            const postSwipeComponent = options.postSwipeComponentName
                ? this.container.querySelector(`.mx-name-${options.postSwipeComponentName}`) as HTMLElement
                : null;
            if (options.postSwipeComponentName && !postSwipeComponent) {
                throw new Error(`No component with the name ${options.postSwipeComponentName} found`);
            }

            if (this.backComponent) {
                domClass.add(this.backComponent, "swipe-background");
            }
            if (postSwipeComponent) {
                domClass.add(postSwipeComponent, "swipe-background-out");
            }
        } else {
            this.foreComponent = this.container;
        }
    }

    private onPan(ev: HammerInput) {
        if (ev.type === "panstart") {
            this.isScrolling = false;
            this.thresholdCompensation = ev.deltaX;
        }
        if (this.isScrolling) {
            return;
        }
        const maximumPercentage = 100;
        let currentPercentage = (maximumPercentage / this.containerSize) * (ev.deltaX - this.thresholdCompensation);
        if (this.direction === Hammer.DIRECTION_RIGHT && currentPercentage < 0) {
            currentPercentage = 0;
        }
        if (this.direction === Hammer.DIRECTION_LEFT && currentPercentage > 0) {
            currentPercentage = 0;
        }
        let animate = false;
        const isScrolling = Math.abs(ev.deltaY) > this.thresholdScrolling;
        if (isScrolling) {
            this.isScrolling = true;
            this.show(0, true);
            return;
        }
        if (ev.type === "panend" || ev.type === "pancancel") {
            if (Math.abs(currentPercentage) > this.swipeAcceptThreshold && ev.type === "panend") {
                const direction: Direction = currentPercentage < 0 ? "left" : "right";
                this.out(direction);
                return;
            }
            currentPercentage = 0;
            animate = true;
        }
        this.show(currentPercentage, animate);
    }

    private show(currentPercentage = 0, animate?: boolean) {
        const hundredPercent = 100;
        const pos = (this.containerSize / hundredPercent) * currentPercentage;
        const translate = "translate3d(" + pos + "px, 0, 0)";


        if (animate) {
            domClass.add(this.container, "animate");
        } else {
            domClass.remove(this.container, "animate");
            domClass.add(this.container, pos < 0 ? "swiping-left" : "swiping-right");
        }

        if (currentPercentage !== 0) {
            domClass.add(this.container, `swiping-${pos < 0 ? "left" : "right"}`);
            domClass.remove(this.container, `swiping-${pos < 0 ? "right" : "left"}`);
        } else {
            domClass.remove(this.container, [ "swiping-right", "swiping-left" ]);
        }

        domStyle.set(this.foreComponent, {
            opacity: this.options.transparentOnSwipe ? 1 - Math.abs(currentPercentage / hundredPercent) : 1,
            transform: translate
        });
    }

    private out(direction: Direction) {
        let pos = direction === "left" ? -this.containerSize : this.containerSize;
        const translate = "translate3d(" + pos + "px, 0, 0)";
        domClass.add(this.container, "animate");
        domStyle.set(this.foreComponent, { transform: translate });
        this.swipedOut = true;
        this.hide(direction);
    }

    private hide(direction: Direction) {
        if (this.options.afterSwipeAction === "remove") {
            setTimeout(() => {
                domClass.add(this.container, "animate");
                domStyle.set(this.container, { height: 0 });

                setTimeout(() => {
                    domClass.add(this.container, "hide");
                    domClass.remove(this.container, "animate");
                    this.options.callback(direction);
                }, this.removeItemDelay);
            }, this.options.callbackDelay);
        } else {
            setTimeout(() => {
                domClass.remove(this.container, "animate");
                this.options.callback(direction);
            }, this.options.callbackDelay);
        }
    }

    private registerExtraEvents() {
        if (this.options.afterSwipeAction === "remove") {
            this.foreComponent.addEventListener("transitionend", () => {
                if (this.swipedOut) {
                    domStyle.set(this.container, {
                        height: this.container.offsetHeight + "px"
                    });
                    if (this.backComponent) { domClass.add(this.backComponent, "hide"); }
                }
            });
        }
    }
}

export { HammerSwipeOut, Direction, AfterSwipeAction, SwipeOutOptions };
