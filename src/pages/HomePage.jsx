import React, { useState, useEffect } from 'react'; // <-- Importar hooks
import Slider from "react-slick";
import ServicesGrid from '../components/ServicesGrid.jsx';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import '../components/ImageSlider.css'; // Mantemos o CSS específico do slider


// ✅ 2. Definir os banners padrão (fallback)
const fallbackImages = [
    "/BANNER.jpeg",
    "/Banner1.jpg",
];

function HomePage() {
    // ✅ 3. Criar estado para os banners e loading
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    // ✅ 4. Buscar banners da API ao carregar
    useEffect(() => {
        const fetchPortalSettings = async () => {
            try {
                const response = await fetch('/api/public/portal-settings');
                if (!response.ok) {
                    throw new Error('Falha ao buscar banners.');
                }
                const data = await response.json();
                
                // Verifica se o DB tem banners salvos
                if (data.banner_images && data.banner_images.length > 0) {
                    // Mapeia os caminhos salvos (ex: /uploads/img.png)
                    const fullImagePaths = data.banner_images.map(imgPath => 
                        // Apenas usamos o caminho relativo. O proxy do Vite (dev) ou o Nginx (prod) resolverá.
                        imgPath.startsWith('http') ? imgPath : imgPath
                    );
                    setImages(fullImagePaths);
                } else {
                    // Se o DB estiver vazio, usa os banners de fallback
                    setImages(fallbackImages);
                }
            } catch (err) {
                console.error("Erro ao carregar banners (usando fallback):", err.message);
                // Se a API falhar, usa os banners de fallback
                setImages(fallbackImages);
            } finally {
                setLoading(false);
            }
        };

        fetchPortalSettings();
    }, []); // Roda só uma vez

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
            <section className="relative w-full overflow-hidden bg-slate-100 min-h-[350px] md:min-h-[500px] h-[50vh] md:h-[70vh] -mt-[73px]">
                
                {/* ✅ 5. Renderiza o slider apenas se não estiver carregando E houver imagens */}
                {!loading && images.length > 0 && (
                    <div className="image-slider-container background-slider">
                        <Slider {...settings}>
                            {images.map((imgUrl, index) => (
                                <div key={index} className="slider-image-wrapper">
                                    <img src={imgUrl} alt={`Background Slide ${index + 1}`} />
                                </div>
                            ))}
                        </Slider>
                    </div>
                )}
            
            </section>
            <ServicesGrid />
        </>
    );
}

export default HomePage;