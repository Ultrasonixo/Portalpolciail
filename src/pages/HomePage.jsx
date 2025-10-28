import React from 'react';
import Slider from "react-slick";
import ServicesGrid from '../components/ServicesGrid.jsx'; // Importamos o componente refatorado (ver passo 4)
// REMOVER: import './HomePage.css'; // Removemos a importação do CSS antigo
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../components/ImageSlider.css'; // Mantemos o CSS específico do slider por enquanto

function HomePage() {
    const images = [
        "/BANNER.jpeg",
        "/Banner1.jpg",
    ];

    const settings = {
        dots: true,
        arrows: true,
        infinite: true,
        speed: 1000,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        fade: true,
        cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
        pauseOnHover: true,
        customPaging: i => (<div className="slick-square-indicator"></div>),
        dotsClass: "slick-dots slick-square-thumbs",
    };

    return (
        <>
            {/* Seção principal APENAS com o slider */}
            {/*
                relative: Necessário para posicionar o slider absoluto dentro
                w-full: Largura total
                overflow-hidden: Esconde partes do slider que saem
                bg-slate-100: Cor de fundo fallback
                min-h-[350px] md:min-h-[500px]: Altura mínima responsiva
                h-[50vh] md:h-[70vh]: Altura responsiva (ajuste conforme necessário)
                -mt-[73px]: Margem negativa para puxar para baixo do header (ajuste se a altura do header mudou)
            */}
            <section className="relative w-full overflow-hidden bg-slate-100 min-h-[350px] md:min-h-[500px] h-[50vh] md:h-[70vh] -mt-[73px]"> {/* Ajuste a margem negativa se necessário */}

                {/* Slider de fundo com setas e quadrinhos */}
                {/* As classes CSS do slider (`ImageSlider.css`) ainda controlam a aparência interna dele */}
                <div className="image-slider-container background-slider">
                    <Slider {...settings}>
                        {images.map((imgUrl, index) => (
                            <div key={index} className="slider-image-wrapper">
                                <img src={imgUrl} alt={`Background Slide ${index + 1}`} />
                            </div>
                        ))}
                    </Slider>
                </div>
            </section>

            {/* A grade de serviços continua abaixo */}
            <ServicesGrid /> {/* Renderiza o componente ServicesGrid refatorado */}
        </>
    );
}

export default HomePage;