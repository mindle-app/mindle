export const NonClickableElement = ({ text }: { text: string }) => {
  return (
    <div className="mt-4 inline-flex shrink grow basis-0 flex-col items-center justify-center gap-2.5 self-stretch rounded-2xl border-2 border-l-0 border-orange-700 border-opacity-10 bg-white px-6 py-4">
      <div className="self-stretch text-center font-['Poppins'] text-2xl font-medium leading-[28.80px] text-black">
        {text}
      </div>
    </div>
  )
}
