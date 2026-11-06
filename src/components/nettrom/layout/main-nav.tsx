import Link from "next/link";
import { Utils } from "@/utils";
import { Constants } from "@/constants";
import { FaHome } from "react-icons/fa";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/shadcn/navigation-menu";

const navLinkClass =
  "group inline-flex h-10 w-full sm:w-max items-center justify-start sm:justify-center rounded-md bg-transparent px-4 py-2 text-sm font-semibold transition-colors hover:bg-neutral-800 hover:text-[#ff9601] focus:bg-neutral-800 focus:text-[#ff9601] disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-neutral-800/50 data-[state=open]:bg-neutral-800 data-[state=open]:text-[#ff9601] text-neutral-200";

export default function MainNav() {
  return (
    <NavigationMenu className="w-full max-w-full justify-start">
      <NavigationMenuList className="w-full flex-col flex-wrap items-start justify-start gap-1 space-x-0 sm:flex-row sm:items-center [&>li]:w-full sm:[&>li]:w-auto">
        <NavigationMenuItem>
          <Link href={Constants.Routes.nettrom.index} legacyBehavior passHref>
            <NavigationMenuLink className={navLinkClass}>
              <FaHome className="mr-2" />
              Trang chủ
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={Constants.Routes.nettrom.following}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink className={navLinkClass}>
              Theo dõi
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={`${Constants.Routes.nettrom.search}?order[followedCount]=desc#results`}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink className={navLinkClass}>
              Hot
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={`${Constants.Routes.nettrom.search}?order[rating]=desc#results`}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink className={navLinkClass}>
              Yêu thích
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={`${Constants.Routes.nettrom.search}?order[createdAt]=desc#results`}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink className={navLinkClass}>
              Mới cập nhật
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href={Constants.Routes.nettrom.history} legacyBehavior passHref>
            <NavigationMenuLink className={navLinkClass}>
              Lịch sử
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger className={navLinkClass}>
            Thể loại
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="max-h-[75vh] w-[320px] overflow-y-auto border-neutral-800 bg-neutral-900 p-4 md:w-[680px] lg:w-[860px]">
              <div className="mb-3 flex items-center justify-between border-b border-neutral-800 pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#ff9601]">
                  Tất cả thể loại ({Constants.Nettrom.tags.length})
                </span>
                <Link
                  href={Constants.Routes.nettrom.search}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Tìm kiếm nâng cao →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1 md:grid-cols-4">
                {Constants.Nettrom.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    title={Utils.Mangadex.transLocalizedStr(
                      tag.attributes.name,
                    )}
                    href={`${Constants.Routes.nettrom.search}?includedTags=${tag.id}#results`}
                    legacyBehavior
                    passHref
                  >
                    <NavigationMenuLink className="block select-none truncate rounded p-1.5 text-xs text-neutral-300 no-underline transition-colors hover:bg-neutral-800 hover:text-[#ff9601] focus:bg-neutral-800 focus:text-[#ff9601]">
                      {Utils.Mangadex.transLocalizedStr(tag.attributes.name)}
                    </NavigationMenuLink>
                  </Link>
                ))}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href={Constants.Routes.nettrom.search} legacyBehavior passHref>
            <NavigationMenuLink className={navLinkClass}>
              Tìm truyện
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={`${Constants.Routes.nettrom.search}?includedTags=53#results`}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink className={navLinkClass}>
              18+
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link
            href={`${Constants.Routes.nettrom.search}?includedTags=55#results`}
            legacyBehavior
            passHref
          >
            <NavigationMenuLink className={navLinkClass}>
              Manhwa
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <a
            href={Constants.Routes.hako}
            target="_blank"
            rel="noreferrer"
            className={navLinkClass}
          >
            Light Novel
          </a>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
