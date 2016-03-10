{*
 +--------------------------------------------------------------------+
 | CiviCRM version 4.7                                                |
 +--------------------------------------------------------------------+
 | Copyright CiviCRM LLC (c) 2004-2014                                |
 +--------------------------------------------------------------------+
 | This file is a part of CiviCRM.                                    |
 |                                                                    |
 | CiviCRM is free software; you can copy, modify, and distribute it  |
 | under the terms of the GNU Affero General Public License           |
 | Version 3, 19 November 2007 and the CiviCRM Licensing Exception.   |
 |                                                                    |
 | CiviCRM is distributed in the hope that it will be useful, but     |
 | WITHOUT ANY WARRANTY; without even the implied warranty of         |
 | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.               |
 | See the GNU Affero General Public License for more details.        |
 |                                                                    |
 | You should have received a copy of the GNU Affero General Public   |
 | License and the CiviCRM Licensing Exception along                  |
 | with this program; if not, contact CiviCRM LLC                     |
 | at info[AT]civicrm[DOT]org. If you have questions about the        |
 | GNU Affero General Public License or the licensing of CiviCRM,     |
 | see the CiviCRM license FAQ at http://civicrm.org/licensing        |
 +--------------------------------------------------------------------+
*}
<div class="crm-block crm-form-block crm-simple-donation-form-block">
<div class="crm-submit-buttons">{include file="CRM/common/formButtons.tpl" location="top"} </div>
        <table class="form-layout-compressed">
            <tr class="crm-simple-donation-form-block">
                <td class="label">{$form.simpleDonation.label}</td>
                <td>{$form.simpleDonation.html}<br />
                <span class="description">{ts}Contribution page that should be used in simple donation form{/ts}</span></td>
            </tr>
            <tr>
              <td class="label">{$form.ziptastic.label}</td>
              <td>{$form.ziptastic.html}<br />
                <span class="description">{ts}This is a US specific service that autofills "City" and "State" based on zipcode. Uncheck for non-US installs.{/ts}</span></td>
           </tr>
        </table>
    <div class="crm-submit-buttons">
        {include file="CRM/common/formButtons.tpl" location="bottom"}
    </div>
<div class="spacer"></div>
</div>
