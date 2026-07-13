import { siteConfig } from '@/lib/site-content';
import Button from './Button';

/**
 * Pulls the real Instagram grid via SnapWidget (no Meta developer app or
 * access token required). Configure NEXT_PUBLIC_SNAPWIDGET_ID once a widget
 * is created at https://snapwidget.com for @selongbayschool. Falls back to a
 * simple follow-us card so the section never looks broken before that's set up.
 */
export default function InstagramSection() {
  const widgetId = process.env.NEXT_PUBLIC_SNAPWIDGET_ID;

  return (
    <div className="mx-auto max-w-6xl px-6 md:px-8">
      <div className="text-center">
        <p className="font-script text-3xl text-orange-deep md:text-4xl">Follow Along</p>
        <h2 className="mt-1 font-display text-3xl font-semibold text-ink md:text-4xl">@selongbayschool on Instagram for more!</h2>
      </div>

      <div className="mt-8">
        {widgetId ? (
          <iframe
            title="Selong Bay School Instagram feed"
            src={`https://snapwidget.com/embed/${widgetId}`}
            className="w-full border-0"
            style={{ height: '480px' }}
            loading="lazy"
          />
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-md border border-sand-line bg-aqua/40 px-8 py-10 text-center">
            <p className="text-[15px] text-ink-soft">
              From surf lessons on Selong Belanak to science experiments, campus adventures, and everything in between,
              our Instagram is where the everyday magic of Selong Bay comes to life. Come take a look!
            </p>
            <Button href={siteConfig.contact.instagram} variant="accent" external>
              Follow the Adventure on Instagram
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
