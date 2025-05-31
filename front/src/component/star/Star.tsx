import React, { useState, useEffect } from "react";
import { Rating } from "react-simple-star-rating";

interface MyComponentProps {
  value: number;
}

export function MyComponent({ value }: MyComponentProps) {
  const [rating, setRating] = useState(value);

  // Catch Rating value
  const handleRating = (rate: number) => {
    setRating(rate);
    // other logic
  };

  // Optinal callback functions
  const onPointerEnter = () => console.log("Enter");
  const onPointerLeave = () => console.log("Leave");
  const onPointerMove = (value: number, index: number) =>
    console.log(value, index);

  useEffect(() => {
    setRating(value); // Обновление рейтинга при изменении пропса
  }, [value]);

  return (
    <div className="App">
      <Rating
        onClick={handleRating}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        readonly
        initialValue={rating} // Устанавливаем начальный рейтинг
        size={35} // Устанавливаем размер звездочек
        SVGstyle={{
          display: "inline-block",
        }}
      />
    </div>
  );
}
