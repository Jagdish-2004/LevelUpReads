import Image from "next/image";

export default function ContactPage() {
  return (
    <div className="w-full flex flex-col items-center pt-16">

      {/* Heading */}
      <h1 className="text-3xl font-light tracking-wide mb-14">
        stay connected!
      </h1>

      {/* Snoopy + Form */}
      <div className="flex w-full max-w-5xl justify-between items-start mb-16">

        {/* Scooter image – moved closer to baseline */}
        <Image
          src="/snoopy_left.png"
          alt="Snoopy scooter"
          width={360}
          height={360}
          className="object-contain -mb-6" 
        />

        {/* Email box */}
        <div className="w-full text-center">
            <div className="border border-black rounded-xl px-6 py-8 w-[360px] shadow-sm w-full text-center">
          <p className="text-sm text-gray-700 mb-6 leading-relaxed w-full text-center">
            get weekly book recommendations and reading challenges.
          </p>

          <div className="flex items-center justify-between border-b border-black pb-2 text-sm">
            <input
              type="email"
              placeholder="your email address"
              className="outline-none flex-1"
            />
            <span>→</span>
        </div>
        
          </div>
        </div>
      </div>

      {/* Baseline + Bird + Happy reading */}
      <div className="w-full max-w-5xl relative">

        {/* Baseline */}
        <div className="w-full h-[2px] bg-black"></div>

        {/* Bird + Text ABOVE the line */}
        <div className="absolute right-0 -top-14 flex items-center gap-3">
             {/* Happy reading */}
            <p className="text-3xl font-light italic tracking-wide font-[Caveat] text-[#2a2a2a] w-full text-center">
                 happy reading :)
              </p>
          {/* Bird */}
          <div className="relative">
            <Image
              src="/small_bird.png"
              alt="small bird"
              width={55}
              height={55}
              className="object-contain"
            />
          </div>

         
        </div>
      </div>
    </div>
  );
}
