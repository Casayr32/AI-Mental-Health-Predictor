export default function MobileHeader({ title, dark }) {
    return (
        <>
            <div className={`mob-hdr${dark ? ' mob-hdr-dark' : ''}`}>
                <button className="ham"><i className="ti ti-menu-2"></i></button>
                <span className="mht">{title}</span>
            </div>
            <div className="sb-ov"></div>
        </>
    );
}