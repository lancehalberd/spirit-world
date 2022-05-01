import { tagElement } from 'app/dom';

interface SingleTab<T extends string> {
    key: T
    label?: string
    render(container: HTMLElement): void
    refresh(container: HTMLElement): void
}
export class TabContainer<T extends string> {
    element: HTMLElement;
    constructor(public selectedTabKey: T, public tabs: SingleTab<T>[], public onSelect?: (key: T) => void) {
        this.element = tagElement('div', 'tabContainer');
    }
    showTab(tabKey: T) {
        this.selectedTabKey = tabKey;
        this.onSelect?.(tabKey);
        this.render();
    }
    render(): void {
        this.element.innerHTML = '';
        const tabsElement = tagElement('div', 'tabContainer-tabs');
        const contentElement = tagElement('div', 'tabContainer-content');
        for (const tab of this.tabs) {
            const tabElement = tagElement('div', 'tabContainer-tab', tab.label || tab.key);
            if (tab.key === this.selectedTabKey) {
                tab.render(contentElement);
                tabElement.classList.add('selected');
            } else {
                tabElement.onclick = () => {
                    this.showTab(tab.key);
                }
            }
            tabsElement.append(tabElement);
        }
        this.element.append(tabsElement);
        this.element.append(contentElement);
    }
}
