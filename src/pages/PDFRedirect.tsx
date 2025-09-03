import { useEffect } from 'react';

const PDFRedirect = () => {
  useEffect(() => {
    // Redirect to the PDF
    window.location.href = "https://mnukhzjcvbwpvktxqlej.supabase.co/storage/v1/object/public/documents/RightsnboundariesLadybossgift.pdf";
  }, []);

  return (
    <div className="min-h-screen bg-luxury-dark flex items-center justify-center">
      <div className="text-luxury-white text-center">
        <div className="animate-spin w-8 h-8 border-2 border-luxury-gold border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Redirecting to your guide...</p>
      </div>
    </div>
  );
};

export default PDFRedirect;