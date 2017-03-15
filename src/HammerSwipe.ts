import * as Hammer from "hammerjs";
import * as domClass from "dojo/dom-class";
import * as domStyle from "dojo/dom-style";

interface SwipeOptions {
    afterSwipeActionLeft: AfterSwipeAction;
    afterSwipeActionRight: AfterSwipeAction;
    afterSwipeBackgroundNameLeft?: string;
    afterSwipeBackgroundNameRight?: string;
    backgroundNameLeft: string;
    backgroundNameRight: string;
    callback: (element: HTMLElement, direction: Direction) => void;
    callbackDelay: number;
    foregroundName: string;
    swipeDirection: Direction | "horizontal";
    transparentOnSwipe?: boolean;
}

type Direction = "right" | "left";
type AfterSwipeAction = "reset" | "hide";

class HammerSwipe {
    private container: HTMLElement;
    private foreElement: HTMLElement;
    private containerSize: number;
    private containerClass: string;
    private hammer: HammerManager;
    private options: SwipeOptions;
    private swipedOut = false;
    private isScrolling = false;
    private backElementRight: HTMLElement;
    private backElementLeft: HTMLElement;
    private afterElementRight: HTMLElement;
    private afterElementLeft: HTMLElement;

    private direction: number;
    private thresholdCompensation = 0;
    // Internal settings
    readonly thresholdScrolling = 60; // Pixels.
    readonly swipeAcceptThreshold = 20; // Percentage.
    readonly removeItemDelay = 400; // Milliseconds
    readonly moveThreshold = 30; // Pixels

    constructor(container: HTMLElement, options: SwipeOptions) {
        this.container = container;
        this.options = options;
        this.containerClass = this.container.className;
        this.containerSize = this.container.offsetWidth;
        this.direction = (Hammer as any)[`DIRECTION_${options.swipeDirection.toUpperCase()}`];

        this.hammer = new Hammer.Manager(this.container);
        this.hammer.add(new Hammer.Pan({
            direction: this.direction,
            threshold: this.moveThreshold
        }));
        this.hammer.on("panstart panmove panend pancancel", event => this.onPan(event));

        this.setupPanes(options);
        this.registerExtraEvents();
    }

    private setupPanes(options: SwipeOptions) {
        this.foreElement = this.findElement(options.foregroundName, "Foreground", "swipe-foreground");

        if (this.foreElement) {
            this.backElementRight = this.findElement(options.backgroundNameRight, "Background right", "swipe-background");
            this.backElementLeft = this.findElement(options.backgroundNameLeft, "Background left", "swipe-background");
            this.afterElementRight = this.findElement(options.afterSwipeBackgroundNameRight, "After swipe background right", "swipe-background-after");
            this.afterElementLeft = this.findElement(options.afterSwipeBackgroundNameLeft, "After swipe background left", "swipe-background-after");
        } else {
            this.foreElement = this.container;
        }
    }

    private findElement(name: string, displayName: string, addClass?: string): HTMLElement | null {
        const element = name ? this.container.querySelector(`.mx-name-${name}`) as HTMLElement : null;
        if (name && !element) {
            throw new Error(`no ${displayName} element found with the name ${name}`);
        }
        if (element && addClass) {
            domClass.add(element, addClass);
        }
        return element;
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

        this.updateBackground(pos);

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

        domStyle.set(this.foreElement, {
            opacity: this.options.transparentOnSwipe ? 1 - Math.abs(currentPercentage / hundredPercent) : 1,
            transform: "translate3d(" + pos + "px, 0, 0)"
        });
    }

    private updateBackground(pos: number) {
        this.afterElementRight && domClass.add(this.afterElementRight, "hidden");
        this.afterElementLeft && domClass.add(this.afterElementLeft, "hidden");
        if (pos < 0) {
            this.backElementRight && this.backElementRight !== this.backElementLeft && domClass.add(this.backElementRight, "hidden");
            this.backElementLeft && domClass.remove(this.backElementLeft, "hidden");
        } else {
            this.backElementRight && domClass.remove(this.backElementRight, "hidden");
            this.backElementLeft && this.backElementRight !== this.backElementLeft && domClass.add(this.backElementLeft, "hidden");
        }
    }

    private out(direction: Direction) {
        const pos = direction === "left" ? -this.containerSize : this.containerSize;
        domClass.add(this.container, "animate");
        domStyle.set(this.foreElement, { transform: "translate3d(" + pos + "px, 0, 0)" });
        this.swipedOut = true;
        this.hide(direction);
    }

    private hide(direction: Direction) {
        if (this.options.afterSwipeActionRight === "reset" && direction === "right" ||
            this.options.afterSwipeActionLeft === "reset" && direction === "left") {
            setTimeout(() => {
                domClass.remove(this.container, "animate");
                domStyle.set(this.foreElement, {
                    opacity: 1,
                    transform: "translate3d(0, 0, 0)"
                });
                this.options.callback(this.container, direction);
            }, this.options.callbackDelay);
        } else if (this.options.afterSwipeActionRight === "hide" && direction === "right" ||
            this.options.afterSwipeActionLeft === "hide" && direction === "left") {
            if (direction === "left") {
                this.afterElementRight && this.afterElementRight !== this.afterElementLeft && domClass.add(this.afterElementRight, "hidden");
                this.afterElementLeft && domClass.remove(this.afterElementLeft, "hidden");
            } else {
                this.afterElementRight && domClass.remove(this.afterElementRight, "hidden");
                this.afterElementLeft && this.afterElementRight !== this.afterElementLeft && domClass.add(this.afterElementLeft, "hidden");
            }
            setTimeout(() => {
                domClass.add(this.container, "animate");
                domStyle.set(this.container, { height: 0 });

                setTimeout(() => {
                    domClass.add(this.container, "hide");
                    domClass.remove(this.container, "animate");
                    this.options.callback(this.container, direction);
                }, this.removeItemDelay);
            }, this.options.callbackDelay);
        }
    }

    private registerExtraEvents() {
        if (this.options.afterSwipeActionRight === "hide") {
            this.foreElement.addEventListener("transitionend", () => {
                if (this.swipedOut) {
                    domStyle.set(this.container, {
                        height: this.container.offsetHeight + "px"
                    });
                    if (this.backElementRight) { domClass.add(this.backElementRight, "hide"); }
                }
            });
        }
        if (this.options.afterSwipeActionLeft === "hide") {
            this.foreElement.addEventListener("transitionend", () => {
                if (this.swipedOut) {
                    domStyle.set(this.container, {
                        height: this.container.offsetHeight + "px"
                    });
                    if (this.backElementLeft) { domClass.add(this.backElementLeft, "hide"); }
                }
            });
        }
    }
}

export { HammerSwipe, Direction, AfterSwipeAction, SwipeOptions };
