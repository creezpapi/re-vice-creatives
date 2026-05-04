# Design Reference

## Palette
- White: `#ffffff`
- Black: `#000000`
- rv-gray: `#f2f2f2`
- rv-tab-inactive: `#666666`

## Typography
- Font: Inter (300, 400, 500, 600)
- Loaded via Google Fonts

## Components
- All buttons: `rounded-full`
- Primary buttons: `h-11`
- Chip buttons: `h-9`
- Icon buttons: `h-8 w-8`
- Section dividers: `border-b border-rv-gray` or `h-[2px] bg-rv-gray`
- Page padding: `px-4 py-6`
- Page max-width: `max-w-screen-lg`
- Interactive elements: `transition-all duration-250 ease-in-out active:scale-95`

## Modals
- Backdrop: `fixed inset-0 z-50 bg-black/40 backdrop-blur-sm overflow-y-auto`
- Card: `max-w-screen-md mx-auto my-12 rounded-2xl bg-white p-6 shadow-lg`
- Three close affordances: X button, ESC key, backdrop click

## Tabs (Alta pattern)
- Equal-flex tabs in `border-b border-rv-gray` row
- Active: `font-medium text-black` with `2px` black underline at `inset-x-[25%]`
- Inactive: `text-rv-tab-inactive`
