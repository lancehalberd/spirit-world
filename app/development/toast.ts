import { tagElement } from 'app/dom';

export function showToast(markup: string | number) {
    const toast = tagElement('div', 'snackbar show', markup);
    document.body.append(toast);
    // This setTimeout duration is tied to the exact animation time specified in the animation in style.css.
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 1000);
    }, 2000);
}
