import Image from "next/image";
import photo from "../../public/machu-picchu.jpg";

/** Full-bleed Machu Picchu photo. `focused` blurs and darkens it so a conversation stays readable. */
export function Backdrop({ focused }: { focused: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <Image
        src={photo}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className={`object-cover object-[50%_40%] transition-[filter,transform] duration-1000 ease-smooth ${focused ? "scale-110 blur-2xl brightness-[0.45]" : "scale-100 brightness-[0.8]"}`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />
    </div>
  );
}
