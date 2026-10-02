import type * as prismic from "@prismicio/client";

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };


type PickContentRelationshipFieldData<
	TRelationship extends prismic.CustomTypeModelFetchCustomTypeLevel1 | prismic.CustomTypeModelFetchCustomTypeLevel2 | prismic.CustomTypeModelFetchGroupLevel1 | prismic.CustomTypeModelFetchGroupLevel2,
	TData extends Record<string, prismic.AnyRegularField | prismic.GroupField | prismic.NestedGroupField | prismic.SliceZone>,
	TLang extends string
> = |
	// Content relationship fields
	{
		[TSubRelationship in Extract<
			TRelationship["fields"][number], prismic.CustomTypeModelFetchContentRelationshipLevel1
		> as TSubRelationship["id"]]:
			ContentRelationshipFieldWithData<TSubRelationship["customtypes"], TLang>;
	} &
	// Group
	{
		[TGroup in Extract<
			TRelationship["fields"][number], prismic.CustomTypeModelFetchGroupLevel1 | prismic.CustomTypeModelFetchGroupLevel2
		> as TGroup["id"]]:
			TData[TGroup["id"]] extends prismic.GroupField<infer TGroupData>
				? prismic.GroupField<PickContentRelationshipFieldData<TGroup, TGroupData, TLang>>
				: never
	} &
	// Other fields
	{
		[TFieldKey in Extract<TRelationship["fields"][number], string>]:
			TFieldKey extends keyof TData ? TData[TFieldKey] : never;
	};

type ContentRelationshipFieldWithData<
	TCustomType extends readonly (prismic.CustomTypeModelFetchCustomTypeLevel1 | string)[] | readonly (prismic.CustomTypeModelFetchCustomTypeLevel2 | string)[],
	TLang extends string = string
> = {
	[ID in Exclude<TCustomType[number], string>["id"]]:
		prismic.ContentRelationshipField<
			ID,
			TLang,
			PickContentRelationshipFieldData<
				Extract<TCustomType[number], { id: ID }>,
				Extract<prismic.Content.AllDocumentTypes, { type: ID }>["data"],
				TLang
			>
		>
}[Exclude<TCustomType[number], string>["id"]];

/**
 * Item in *Food Menu → Menu buttons (top to bottom)*
 */
export interface FoodMenuDocumentDataMenusItem {
	/**
	 * Button label field in *Food Menu → Menu buttons (top to bottom)*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: food_menu.menus[].label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * Menu PDF (upload a new file to replace) field in *Food Menu → Menu buttons (top to bottom)*
	 *
	 * - **Field Type**: Link to Media
	 * - **Placeholder**: *None*
	 * - **API ID Path**: food_menu.menus[].file
	 * - **Documentation**: https://prismic.io/docs/fields/link-to-media
	 */
	file: prismic.LinkToMediaField<prismic.FieldState, never>;
}

/**
 * Content for Food Menu documents
 */
interface FoodMenuDocumentData {
	/**
	 * Meta title (browser tab & search results) field in *Food Menu*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Page name for the browser tab, e.g. Bookings (" | Ghost Street" is added automatically). Empty = page heading.
	 * - **API ID Path**: food_menu.meta_title
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_title: prismic.KeyTextField;
	
	/**
	 * Meta description (search results & social shares) field in *Food Menu*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: One or two sentences summarising the page
	 * - **API ID Path**: food_menu.meta_description
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_description: prismic.KeyTextField;
	
	/**
	 * Social share image field in *Food Menu*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: food_menu.meta_image
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	meta_image: prismic.ImageField<never>;
	
	/**
	 * Structured data (JSON-LD schema), paste raw JSON field in *Food Menu*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: {"@context": "https://schema.org", ...}
	 * - **API ID Path**: food_menu.json_ld
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	json_ld: prismic.RichTextField;/**
	 * Page name (H1 for screen readers & search engines; not shown visually) field in *Food Menu*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: food_menu.title
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	title: prismic.KeyTextField;
	
	/**
	 * Background image field in *Food Menu*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: food_menu.cover_image
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	cover_image: prismic.ImageField<never>;
	
	/**
	 * Menu buttons (top to bottom) field in *Food Menu*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: food_menu.menus[]
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	menus: prismic.GroupField<Simplify<FoodMenuDocumentDataMenusItem>>;
}

/**
 * Food Menu document from Prismic
 *
 * - **API ID**: `food_menu`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type FoodMenuDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<FoodMenuDocumentData>, "food_menu", Lang>;

/**
 * Item in *Home → Teaser 3 – reviews (rotate every 6 seconds)*
 */
export interface HomeDocumentDataReviewsItem {
	/**
	 * Quote (include quotation marks) field in *Home → Teaser 3 – reviews (rotate every 6 seconds)*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.reviews[].quote
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	quote: prismic.KeyTextField;
	
	/**
	 * Reviewer, publication field in *Home → Teaser 3 – reviews (rotate every 6 seconds)*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.reviews[].citation
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	citation: prismic.KeyTextField;
}

/**
 * Content for Home documents
 */
interface HomeDocumentData {
	/**
	 * Meta title (browser tab & search results) field in *Home*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Page name for the browser tab, e.g. Bookings (" | Ghost Street" is added automatically). Empty = page heading.
	 * - **API ID Path**: home.meta_title
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_title: prismic.KeyTextField;
	
	/**
	 * Meta description (search results & social shares) field in *Home*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: One or two sentences summarising the page
	 * - **API ID Path**: home.meta_description
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_description: prismic.KeyTextField;
	
	/**
	 * Social share image field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.meta_image
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	meta_image: prismic.ImageField<never>;
	
	/**
	 * Structured data (JSON-LD schema), paste raw JSON field in *Home*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: {"@context": "https://schema.org", ...}
	 * - **API ID Path**: home.json_ld
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	json_ld: prismic.RichTextField;/**
	 * Hero video (desktop & tablet, MP4, plays muted on loop) field in *Home*
	 *
	 * - **Field Type**: Link to Media
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.hero_video
	 * - **Tab**: Hero
	 * - **Documentation**: https://prismic.io/docs/fields/link-to-media
	 */
	hero_video: prismic.LinkToMediaField<prismic.FieldState, never>;
	
	/**
	 * Hero image – phone landscape (shown instead of the video on phones) field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.cover_image
	 * - **Tab**: Hero
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	cover_image: prismic.ImageField<never>;
	
	/**
	 * Hero image – phone portrait field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.cover_image_mobile
	 * - **Tab**: Hero
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	cover_image_mobile: prismic.ImageField<never>;
	
	/**
	 * Announcement link (top-left of hero; shown only when link text is filled) field in *Home*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.hero_link
	 * - **Tab**: Hero
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	hero_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;/**
	 * Teaser 1 (top left) – image field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_1_image
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	teaser_1_image: prismic.ImageField<never>;
	
	/**
	 * Teaser 1 – text over image (optional) field in *Home*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_1_text
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	teaser_1_text: prismic.RichTextField;
	
	/**
	 * Teaser 1 – link (optional) field in *Home*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_1_link
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	teaser_1_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * Teaser 2 (top right) – image field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_2_image
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	teaser_2_image: prismic.ImageField<never>;
	
	/**
	 * Teaser 2 – text under the menu icon field in *Home*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_2_text
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	teaser_2_text: prismic.RichTextField;
	
	/**
	 * Teaser 2 – link (optional) field in *Home*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_2_link
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	teaser_2_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * Teaser 3 (bottom left) – background illustration behind reviews field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.reviews_image
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	reviews_image: prismic.ImageField<never>;
	
	/**
	 * Teaser 3 – reviews (rotate every 6 seconds) field in *Home*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.reviews[]
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	reviews: prismic.GroupField<Simplify<HomeDocumentDataReviewsItem>>;
	
	/**
	 * Teaser 4 (bottom right) – image field in *Home*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_4_image
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	teaser_4_image: prismic.ImageField<never>;
	
	/**
	 * Teaser 4 – text over image (optional) field in *Home*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_4_text
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	teaser_4_text: prismic.RichTextField;
	
	/**
	 * Teaser 4 – link (optional) field in *Home*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: home.teaser_4_link
	 * - **Tab**: Teasers
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	teaser_4_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Home document from Prismic
 *
 * - **API ID**: `home`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type HomeDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<HomeDocumentData>, "home", Lang>;

type NavigationDocumentDataSlicesSlice = NavigationLinkSlice | NavigationDropdownSlice

/**
 * Content for Navigation documents
 */
interface NavigationDocumentData {
	/**
	 * Slice Zone field in *Navigation*
	 *
	 * - **Field Type**: Slice Zone
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation.slices[]
	 * - **Tab**: Menu
	 * - **Documentation**: https://prismic.io/docs/slices
	 */
	slices: prismic.SliceZone<NavigationDocumentDataSlicesSlice>;
}

/**
 * Navigation document from Prismic
 *
 * - **API ID**: `navigation`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type NavigationDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<NavigationDocumentData>, "navigation", Lang>;

/**
 * Content for Page documents
 */
interface PageDocumentData {
	/**
	 * Meta title (browser tab & search results) field in *Page*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Page name for the browser tab, e.g. Bookings (" | Ghost Street" is added automatically). Empty = page heading.
	 * - **API ID Path**: page.meta_title
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_title: prismic.KeyTextField;
	
	/**
	 * Meta description (search results & social shares) field in *Page*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: One or two sentences summarising the page
	 * - **API ID Path**: page.meta_description
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	meta_description: prismic.KeyTextField;
	
	/**
	 * Social share image field in *Page*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.meta_image
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	meta_image: prismic.ImageField<never>;
	
	/**
	 * Structured data (JSON-LD schema), paste raw JSON field in *Page*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: {"@context": "https://schema.org", ...}
	 * - **API ID Path**: page.json_ld
	 * - **Tab**: SEO
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	json_ld: prismic.RichTextField;/**
	 * Heading (H1) field in *Page*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.title
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	title: prismic.RichTextField;
	
	/**
	 * Left column image (under the heading) field in *Page*
	 *
	 * - **Field Type**: Image
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.side_image
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/image
	 */
	side_image: prismic.ImageField<never>;
	
	/**
	 * Body text (right column) field in *Page*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: page.body
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	body: prismic.RichTextField;
	
	/**
	 * Show the online booking widget under the text field in *Page*
	 *
	 * - **Field Type**: Boolean
	 * - **Placeholder**: *None*
	 * - **Default Value**: false
	 * - **API ID Path**: page.show_booking_widget
	 * - **Tab**: Content
	 * - **Documentation**: https://prismic.io/docs/fields/boolean
	 */
	show_booking_widget: prismic.BooleanField;
}

/**
 * Page document from Prismic
 *
 * - **API ID**: `page`
 * - **Repeatable**: `true`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type PageDocument<Lang extends string = string> = prismic.PrismicDocumentWithUID<Simplify<PageDocumentData>, "page", Lang>;

/**
 * Item in *Settings → Social links (menu & social overlay)*
 */
export interface SettingsDocumentDataSocialLinksItem {
	/**
	 * Platform (sets the icon) field in *Settings → Social links (menu & social overlay)*
	 *
	 * - **Field Type**: Select
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.social_links[].platform
	 * - **Documentation**: https://prismic.io/docs/fields/select
	 */
	platform: prismic.SelectField<"instagram" | "facebook" | "twitter">;
	
	/**
	 * Profile URL field in *Settings → Social links (menu & social overlay)*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.social_links[].url
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	url: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Content for Settings documents
 */
interface SettingsDocumentData {
	/**
	 * Newsletter heading field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Sign up
	 * - **API ID Path**: settings.newsletter_heading
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	newsletter_heading: prismic.KeyTextField;
	
	/**
	 * Footer link that opens the social overlay field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: Social
	 * - **API ID Path**: settings.social_link_label
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	social_link_label: prismic.KeyTextField;
	
	/**
	 * Note above the venue name (e.g. Open 7 days a week) field in *Settings*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.footer_note
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	footer_note: prismic.RichTextField;
	
	/**
	 * Venue name (footer heading) field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.venue_name
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	venue_name: prismic.KeyTextField;
	
	/**
	 * Phone number field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.phone
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	phone: prismic.KeyTextField;
	
	/**
	 * Email address field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.email
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	email: prismic.KeyTextField;
	
	/**
	 * Opening hours (one line per day group; Shift+Enter for a new line) field in *Settings*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.opening_hours
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	opening_hours: prismic.RichTextField;
	
	/**
	 * Address & directions (Shift+Enter for a new line) field in *Settings*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.address
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	address: prismic.RichTextField;
	
	/**
	 * Directions link (Google Maps) field in *Settings*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.map_link
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	map_link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
	
	/**
	 * Map image or PDF field in *Settings*
	 *
	 * - **Field Type**: Link to Media
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.map_file
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/link-to-media
	 */
	map_file: prismic.LinkToMediaField<prismic.FieldState, never>;
	
	/**
	 * Copyright line (the © and current year are added automatically) field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.copyright
	 * - **Tab**: Footer
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	copyright: prismic.KeyTextField;/**
	 * Social links (menu & social overlay) field in *Settings*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.social_links[]
	 * - **Tab**: Social
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	social_links: prismic.GroupField<Simplify<SettingsDocumentDataSocialLinksItem>>;/**
	 * Footer link text that opens the notice (leave empty to hide the notice) field in *Settings*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: e.g. Holiday hours
	 * - **API ID Path**: settings.special_link_label
	 * - **Tab**: Special notice
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	special_link_label: prismic.KeyTextField;
	
	/**
	 * Notice shown in a full-screen overlay (e.g. special or holiday hours) field in *Settings*
	 *
	 * - **Field Type**: Rich Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: settings.special_notice
	 * - **Tab**: Special notice
	 * - **Documentation**: https://prismic.io/docs/fields/rich-text
	 */
	special_notice: prismic.RichTextField;
}

/**
 * Settings document from Prismic
 *
 * - **API ID**: `settings`
 * - **Repeatable**: `false`
 * - **Documentation**: https://prismic.io/docs/content-modeling
 *
 * @typeParam Lang - Language API ID of the document.
 */
export type SettingsDocument<Lang extends string = string> = prismic.PrismicDocumentWithoutUID<Simplify<SettingsDocumentData>, "settings", Lang>;

export type AllDocumentTypes = FoodMenuDocument | HomeDocument | NavigationDocument | PageDocument | SettingsDocument;

/**
 * Item in *Navigation Dropdown → Default → Primary → Sub-menu links*
 */
export interface NavigationDropdownSliceDefaultPrimaryLinksItem {
	/**
	 * Label field in *Navigation Dropdown → Default → Primary → Sub-menu links*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation_dropdown.default.primary.links[].label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * Link (page or web address) field in *Navigation Dropdown → Default → Primary → Sub-menu links*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation_dropdown.default.primary.links[].link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Primary content in *Navigation Dropdown → Default → Primary*
 */
export interface NavigationDropdownSliceDefaultPrimary {
	/**
	 * Dropdown label (opens the sub-menu) field in *Navigation Dropdown → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation_dropdown.default.primary.label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * Sub-menu links field in *Navigation Dropdown → Default → Primary*
	 *
	 * - **Field Type**: Group
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation_dropdown.default.primary.links[]
	 * - **Documentation**: https://prismic.io/docs/fields/repeatable-group
	 */
	links: prismic.GroupField<Simplify<NavigationDropdownSliceDefaultPrimaryLinksItem>>;
}

/**
 * Default variation for Navigation Dropdown Slice
 *
 * - **API ID**: `default`
 * - **Description**: Default
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavigationDropdownSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavigationDropdownSliceDefaultPrimary>, never>;

/**
 * Slice variation for *Navigation Dropdown*
 */
type NavigationDropdownSliceVariation = NavigationDropdownSliceDefault

/**
 * Navigation Dropdown Shared Slice
 *
 * - **API ID**: `navigation_dropdown`
 * - **Description**: *None*
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavigationDropdownSlice = prismic.SharedSlice<"navigation_dropdown", NavigationDropdownSliceVariation>;

/**
 * Primary content in *Navigation Link → Default → Primary*
 */
export interface NavigationLinkSliceDefaultPrimary {
	/**
	 * Menu label field in *Navigation Link → Default → Primary*
	 *
	 * - **Field Type**: Text
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation_link.default.primary.label
	 * - **Documentation**: https://prismic.io/docs/fields/text
	 */
	label: prismic.KeyTextField;
	
	/**
	 * Link (page or web address) field in *Navigation Link → Default → Primary*
	 *
	 * - **Field Type**: Link
	 * - **Placeholder**: *None*
	 * - **API ID Path**: navigation_link.default.primary.link
	 * - **Documentation**: https://prismic.io/docs/fields/link
	 */
	link: prismic.LinkField<string, string, unknown, prismic.FieldState, never>;
}

/**
 * Default variation for Navigation Link Slice
 *
 * - **API ID**: `default`
 * - **Description**: Default
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavigationLinkSliceDefault = prismic.SharedSliceVariation<"default", Simplify<NavigationLinkSliceDefaultPrimary>, never>;

/**
 * Slice variation for *Navigation Link*
 */
type NavigationLinkSliceVariation = NavigationLinkSliceDefault

/**
 * Navigation Link Shared Slice
 *
 * - **API ID**: `navigation_link`
 * - **Description**: *None*
 * - **Documentation**: https://prismic.io/docs/slices
 */
export type NavigationLinkSlice = prismic.SharedSlice<"navigation_link", NavigationLinkSliceVariation>;

declare module "@prismicio/client" {
	interface CreateClient {
		(repositoryNameOrEndpoint: string, options?: prismic.ClientConfig): prismic.Client<AllDocumentTypes>;
	}
	
	interface CreateWriteClient {
		(repositoryNameOrEndpoint: string, options: prismic.WriteClientConfig): prismic.WriteClient<AllDocumentTypes>;
	}
	
	interface CreateMigration {
		(): prismic.Migration<AllDocumentTypes>;
	}
	
	namespace Content {
		export type {
			FoodMenuDocument,
			FoodMenuDocumentData,
			FoodMenuDocumentDataMenusItem,
			HomeDocument,
			HomeDocumentData,
			HomeDocumentDataReviewsItem,
			NavigationDocument,
			NavigationDocumentData,
			NavigationDocumentDataSlicesSlice,
			PageDocument,
			PageDocumentData,
			SettingsDocument,
			SettingsDocumentData,
			SettingsDocumentDataSocialLinksItem,
			AllDocumentTypes,
			NavigationDropdownSlice,
			NavigationDropdownSliceDefaultPrimaryLinksItem,
			NavigationDropdownSliceDefaultPrimary,
			NavigationDropdownSliceVariation,
			NavigationDropdownSliceDefault,
			NavigationLinkSlice,
			NavigationLinkSliceDefaultPrimary,
			NavigationLinkSliceVariation,
			NavigationLinkSliceDefault
		}
	}
}